import AccessControl "authorization/access-control";
import InviteLinksModule "invite-links/invite-links-module";
import Migration "migration";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Text "mo:base/Text";
import List "mo:base/List";
import Random "mo:base/Random";
import Int "mo:base/Int";

(with migration = Migration.run)
actor AttendanceManagement {
  let accessControlState = AccessControl.initState();

  public shared ({ caller }) func initializeAccessControl() : async () {
    AccessControl.initialize(accessControlState, caller);
  };

  public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
    AccessControl.getUserRole(accessControlState, caller);
  };

  public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
    // Admin-only check happens inside assignRole
    AccessControl.assignRole(accessControlState, caller, user, role);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    AccessControl.isAdmin(accessControlState, caller);
  };

  public type UserProfile = {
    name : Text;
    position : Text;
    isEmployee : Bool;
    holidayBalance : Nat;
  };

  transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
  var userProfiles = principalMap.empty<UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono visualizzare i profili");
    };
    principalMap.get(userProfiles, caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Non autorizzato: puoi visualizzare solo il tuo profilo");
    };
    principalMap.get(userProfiles, user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono salvare i profili");
    };
    userProfiles := principalMap.put(userProfiles, caller, profile);
  };

  public type AttendanceStatus = {
    #present;
    #absent;
    #remoteWork;
    #holiday;
    #law104Leave;
    #sickness;
    #timeBank;
  };

  public type ActivityType = {
    #project : Text;
    #service : Text;
    #genericActivity : Text;
    #weekend;
    #workshops;
  };

  public type AttendanceRecord = {
    id : Nat;
    date : Time.Time;
    status : AttendanceStatus;
    activity : ActivityType;
    startTime : ?Text;
    endTime : ?Text;
    breakDuration : ?Nat;
    hoursWorked : ?Nat;
    notes : ?Text;
    timestamp : Time.Time;
  };

  public type AttendanceModification = {
    recordId : Nat;
    modifiedBy : Principal;
    modificationType : {
      #created;
      #updated;
      #deleted;
    };
    timestamp : Time.Time;
    oldRecord : ?AttendanceRecord;
    newRecord : ?AttendanceRecord;
  };

  public type HolidayRequest = {
    id : Nat;
    user : Principal;
    startDate : Time.Time;
    endDate : Time.Time;
    status : {
      #pending;
      #approved;
      #rejected;
    };
    reason : Text;
  };

  public type PermissionRequest = {
    id : Nat;
    user : Principal;
    startDate : Time.Time;
    endDate : Time.Time;
    status : {
      #pending;
      #approved;
      #rejected;
    };
    reason : Text;
    requestType : {
      #generic;
      #medical;
      #familyEmergency;
    };
  };

  transient let natMap = OrderedMap.Make<Nat>(func(a : Nat, b : Nat) : { #less; #equal; #greater } { if (a < b) #less else if (a == b) #equal else #greater });
  var holidayRequests = natMap.empty<HolidayRequest>();
  var nextHolidayRequestId = 0;

  var permissionRequests = natMap.empty<PermissionRequest>();
  var nextPermissionRequestId = 0;

  var attendanceRecords = principalMap.empty<List.List<AttendanceRecord>>();
  var attendanceModifications = principalMap.empty<List.List<AttendanceModification>>();
  var nextAttendanceRecordId = 0;

  let minValidDate : Time.Time = 1735689600000000000; // 1 gennaio 2025

  public shared ({ caller }) func recordAttendance(record : AttendanceRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono registrare le presenze");
    };

    if (record.date < minValidDate) {
      Debug.trap("La data selezionata deve essere successiva a gennaio 2025");
    };

    let recordId = nextAttendanceRecordId;
    nextAttendanceRecordId += 1;

    let newRecord = {
      id = recordId;
      date = record.date;
      status = record.status;
      activity = record.activity;
      startTime = record.startTime;
      endTime = record.endTime;
      breakDuration = record.breakDuration;
      hoursWorked = record.hoursWorked;
      notes = record.notes;
      timestamp = Time.now();
    };

    let existingRecords = switch (principalMap.get(attendanceRecords, caller)) {
      case null List.nil<AttendanceRecord>();
      case (?records) records;
    };

    let updatedRecords = List.push(newRecord, existingRecords);
    attendanceRecords := principalMap.put(attendanceRecords, caller, updatedRecords);

    let modification : AttendanceModification = {
      recordId;
      modifiedBy = caller;
      modificationType = #created;
      timestamp = Time.now();
      oldRecord = null;
      newRecord = ?newRecord;
    };

    let existingModifications = switch (principalMap.get(attendanceModifications, caller)) {
      case null List.nil<AttendanceModification>();
      case (?mods) mods;
    };

    let updatedModifications = List.push(modification, existingModifications);
    attendanceModifications := principalMap.put(attendanceModifications, caller, updatedModifications);
  };

  public shared ({ caller }) func updateAttendanceRecord(recordId : Nat, updatedRecord : AttendanceRecord) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono modificare le presenze");
    };

    if (updatedRecord.date < minValidDate) {
      Debug.trap("La data selezionata deve essere successiva a gennaio 2025");
    };

    switch (principalMap.get(attendanceRecords, caller)) {
      case null Debug.trap("Record di presenza non trovato");
      case (?records) {
        let oldRecordList = List.filter<AttendanceRecord>(
          records,
          func(record) { record.id == recordId },
        );

        switch (List.get(oldRecordList, 0)) {
          case null Debug.trap("Record di presenza non trovato");
          case (?oldRecord) {
            let filteredRecords = List.filter<AttendanceRecord>(
              records,
              func(record) { record.id != recordId },
            );

            let newRecord = {
              id = recordId;
              date = updatedRecord.date;
              status = updatedRecord.status;
              activity = updatedRecord.activity;
              startTime = updatedRecord.startTime;
              endTime = updatedRecord.endTime;
              breakDuration = updatedRecord.breakDuration;
              hoursWorked = updatedRecord.hoursWorked;
              notes = updatedRecord.notes;
              timestamp = Time.now();
            };

            let updatedRecords = List.push(newRecord, filteredRecords);
            attendanceRecords := principalMap.put(attendanceRecords, caller, updatedRecords);

            let modification : AttendanceModification = {
              recordId;
              modifiedBy = caller;
              modificationType = #updated;
              timestamp = Time.now();
              oldRecord = ?oldRecord;
              newRecord = ?newRecord;
            };

            let existingModifications = switch (principalMap.get(attendanceModifications, caller)) {
              case null List.nil<AttendanceModification>();
              case (?mods) mods;
            };

            let updatedModifications = List.push(modification, existingModifications);
            attendanceModifications := principalMap.put(attendanceModifications, caller, updatedModifications);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteAttendanceRecord(recordId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono cancellare le presenze");
    };

    switch (principalMap.get(attendanceRecords, caller)) {
      case null Debug.trap("Record di presenza non trovato");
      case (?records) {
        let oldRecordList = List.filter<AttendanceRecord>(
          records,
          func(record) { record.id == recordId },
        );

        switch (List.get(oldRecordList, 0)) {
          case null Debug.trap("Record di presenza non trovato");
          case (?oldRecord) {
            let filteredRecords = List.filter<AttendanceRecord>(
              records,
              func(record) { record.id != recordId },
            );

            attendanceRecords := principalMap.put(attendanceRecords, caller, filteredRecords);

            let modification : AttendanceModification = {
              recordId;
              modifiedBy = caller;
              modificationType = #deleted;
              timestamp = Time.now();
              oldRecord = ?oldRecord;
              newRecord = null;
            };

            let existingModifications = switch (principalMap.get(attendanceModifications, caller)) {
              case null List.nil<AttendanceModification>();
              case (?mods) mods;
            };

            let updatedModifications = List.push(modification, existingModifications);
            attendanceModifications := principalMap.put(attendanceModifications, caller, updatedModifications);
          };
        };
      };
    };
  };

  public query ({ caller }) func getMyAttendanceRecords() : async [AttendanceRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono visualizzare le proprie presenze");
    };
    switch (principalMap.get(attendanceRecords, caller)) {
      case null [];
      case (?records) List.toArray(records);
    };
  };

  public query ({ caller }) func getMyAttendanceModifications() : async [AttendanceModification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono visualizzare le proprie modifiche");
    };
    switch (principalMap.get(attendanceModifications, caller)) {
      case null [];
      case (?mods) List.toArray(mods);
    };
  };

  public query ({ caller }) func getUserAttendanceRecords(user : Principal) : async [AttendanceRecord] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Non autorizzato: puoi visualizzare solo le tue presenze");
    };
    switch (principalMap.get(attendanceRecords, user)) {
      case null [];
      case (?records) List.toArray(records);
    };
  };

  public query ({ caller }) func getUserAttendanceModifications(user : Principal) : async [AttendanceModification] {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Debug.trap("Non autorizzato: puoi visualizzare solo le tue modifiche");
    };
    switch (principalMap.get(attendanceModifications, user)) {
      case null [];
      case (?mods) List.toArray(mods);
    };
  };

  public shared ({ caller }) func submitHolidayRequest(startDate : Time.Time, endDate : Time.Time, reason : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono inviare richieste ferie");
    };

    let requestId = nextHolidayRequestId;
    nextHolidayRequestId += 1;

    let request : HolidayRequest = {
      id = requestId;
      user = caller;
      startDate;
      endDate;
      status = #pending;
      reason;
    };

    holidayRequests := natMap.put(holidayRequests, requestId, request);
    requestId;
  };

  // New functions for PermissionRequests

  public shared ({ caller }) func submitPermissionRequest(startDate : Time.Time, endDate : Time.Time, reason : Text, requestType : { #generic; #medical; #familyEmergency }) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono inviare richieste permessi");
    };

    let requestId = nextPermissionRequestId;
    nextPermissionRequestId += 1;

    let request : PermissionRequest = {
      id = requestId;
      user = caller;
      startDate;
      endDate;
      status = #pending;
      reason;
      requestType;
    };

    permissionRequests := natMap.put(permissionRequests, requestId, request);
    requestId;
  };

  public query ({ caller }) func getMyPermissionRequests() : async [PermissionRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono visualizzare le proprie richieste permessi");
    };
    let requests = Iter.toArray(natMap.vals(permissionRequests));
    let myRequests = List.filter<PermissionRequest>(
      List.fromArray(requests),
      func(request) { request.user == caller },
    );
    List.toArray(myRequests);
  };

  public query ({ caller }) func getAllPermissionRequests() : async [PermissionRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare tutte le richieste permessi");
    };
    Iter.toArray(natMap.vals(permissionRequests));
  };

  public shared ({ caller }) func approvePermissionRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono approvare le richieste permessi");
    };

    switch (natMap.get(permissionRequests, requestId)) {
      case null Debug.trap("Richiesta permesso non trovata");
      case (?request) {
        let updatedRequest = {
          id = request.id;
          user = request.user;
          startDate = request.startDate;
          endDate = request.endDate;
          status = #approved;
          reason = request.reason;
          requestType = request.requestType;
        };
        permissionRequests := natMap.put(permissionRequests, requestId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func rejectPermissionRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono rifiutare le richieste permessi");
    };

    switch (natMap.get(permissionRequests, requestId)) {
      case null Debug.trap("Richiesta permesso non trovata");
      case (?request) {
        let updatedRequest = {
          id = request.id;
          user = request.user;
          startDate = request.startDate;
          endDate = request.endDate;
          status = #rejected;
          reason = request.reason;
          requestType = request.requestType;
        };
        permissionRequests := natMap.put(permissionRequests, requestId, updatedRequest);
      };
    };
  };

  public query ({ caller }) func getMyHolidayRequests() : async [HolidayRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono visualizzare le proprie richieste ferie");
    };
    let requests = Iter.toArray(natMap.vals(holidayRequests));
    let myRequests = List.filter<HolidayRequest>(
      List.fromArray(requests),
      func(request) { request.user == caller },
    );
    List.toArray(myRequests);
  };

  public query ({ caller }) func getAllHolidayRequests() : async [HolidayRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare tutte le richieste ferie");
    };
    Iter.toArray(natMap.vals(holidayRequests));
  };

  public shared ({ caller }) func approveHolidayRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono approvare le richieste ferie");
    };

    switch (natMap.get(holidayRequests, requestId)) {
      case null Debug.trap("Richiesta ferie non trovata");
      case (?request) {
        let updatedRequest = {
          id = request.id;
          user = request.user;
          startDate = request.startDate;
          endDate = request.endDate;
          status = #approved;
          reason = request.reason;
        };
        holidayRequests := natMap.put(holidayRequests, requestId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func rejectHolidayRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono rifiutare le richieste ferie");
    };

    switch (natMap.get(holidayRequests, requestId)) {
      case null Debug.trap("Richiesta ferie non trovata");
      case (?request) {
        let updatedRequest = {
          id = request.id;
          user = request.user;
          startDate = request.startDate;
          endDate = request.endDate;
          status = #rejected;
          reason = request.reason;
        };
        holidayRequests := natMap.put(holidayRequests, requestId, updatedRequest);
      };
    };
  };

  public query ({ caller }) func getAllAttendanceRecords() : async [(Principal, [AttendanceRecord])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare tutte le presenze");
    };
    let entries = Iter.toArray(principalMap.entries(attendanceRecords));
    List.toArray(
      List.map<(Principal, List.List<AttendanceRecord>), (Principal, [AttendanceRecord])>(
        List.fromArray(entries),
        func((user, records)) { (user, List.toArray(records)) },
      )
    );
  };

  public query ({ caller }) func getAttendanceByDay(date : Time.Time) : async [(Principal, AttendanceRecord)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare i report giornalieri");
    };
    let entries = Iter.toArray(principalMap.entries(attendanceRecords));
    var dailyRecords = List.nil<(Principal, AttendanceRecord)>();

    for ((user, records) in entries.vals()) {
      let recordList = List.filter<AttendanceRecord>(
        records,
        func(record) { record.date == date },
      );
      switch (List.get(recordList, 0)) {
        case null {};
        case (?record) {
          dailyRecords := List.push((user, record), dailyRecords);
        };
      };
    };

    List.toArray(dailyRecords);
  };

  public query ({ caller }) func getAttendanceByWeek(startDate : Time.Time) : async [(Principal, [AttendanceRecord])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare i report settimanali");
    };
    let entries = Iter.toArray(principalMap.entries(attendanceRecords));
    var weeklyRecords = List.nil<(Principal, [AttendanceRecord])>();

    for ((user, records) in entries.vals()) {
      let weekRecords = List.filter<AttendanceRecord>(
        records,
        func(record) {
          let recordTime = record.date;
          recordTime >= startDate and recordTime < (startDate + 7 * 24 * 60 * 60 * 1000000000);
        },
      );
      if (not List.isNil(weekRecords)) {
        weeklyRecords := List.push((user, List.toArray(weekRecords)), weeklyRecords);
      };
    };

    List.toArray(weeklyRecords);
  };

  public query ({ caller }) func getAttendanceByMonth(startDate : Time.Time) : async [(Principal, [AttendanceRecord])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare i report mensili");
    };
    let entries = Iter.toArray(principalMap.entries(attendanceRecords));
    var monthlyRecords = List.nil<(Principal, [AttendanceRecord])>();

    for ((user, records) in entries.vals()) {
      let monthRecords = List.filter<AttendanceRecord>(
        records,
        func(record) {
          let recordTime = record.date;
          recordTime >= startDate and recordTime < (startDate + 30 * 24 * 60 * 60 * 1000000000);
        },
      );
      if (not List.isNil(monthRecords)) {
        monthlyRecords := List.push((user, List.toArray(monthRecords)), monthlyRecords);
      };
    };

    List.toArray(monthlyRecords);
  };

  public query ({ caller }) func getHolidayRequestsByPeriod(startDate : Time.Time, endDate : Time.Time) : async [HolidayRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare i report ferie per periodo");
    };
    let requests = Iter.toArray(natMap.vals(holidayRequests));
    let periodRequests = List.filter<HolidayRequest>(
      List.fromArray(requests),
      func(request) {
        request.startDate >= startDate and request.endDate <= endDate
      },
    );
    List.toArray(periodRequests);
  };

  public query ({ caller }) func getAttendanceModificationsByPeriod(startDate : Time.Time, endDate : Time.Time) : async [AttendanceModification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare lo storico modifiche per periodo");
    };
    let entries = Iter.toArray(principalMap.entries(attendanceModifications));
    var periodModifications = List.nil<AttendanceModification>();

    for ((_, mods) in entries.vals()) {
      let periodMods = List.filter<AttendanceModification>(
        mods,
        func(mod) {
          mod.timestamp >= startDate and mod.timestamp <= endDate
        },
      );
      if (not List.isNil(periodMods)) {
        periodModifications := List.append(periodModifications, periodMods);
      };
    };

    List.toArray(periodModifications);
  };

  // Invite links and RSVP system
  let inviteState = InviteLinksModule.initState();

  // Generate invite code with role (admin only)
  public shared ({ caller }) func generateInviteCodeWithRole(role : AccessControl.UserRole) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono generare codici di invito");
    };
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    code;
  };

  // Generate invite code (admin only) - deprecated, use generateInviteCodeWithRole instead
  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono generare codici di invito");
    };
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    code;
  };

  func roleText(role : AccessControl.UserRole) : Text {
    switch (role) {
      case (#admin) "admin";
      case (#user) "user";
      case (#guest) "guest";
    };
  };

  // Submit RSVP (public, but requires valid invite code)
  public shared func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  // Get all RSVPs (admin only)
  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare le risposte RSVP");
    };
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  // Get all invite codes (admin only)
  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare i codici di invito");
    };
    InviteLinksModule.getInviteCodes(inviteState);
  };

  // Calculate total hours worked for a given period
  public query ({ caller }) func calculateTotalHours(startDate : Time.Time, endDate : Time.Time) : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Debug.trap("Non autorizzato: solo gli utenti possono calcolare le ore totali");
    };
    switch (principalMap.get(attendanceRecords, caller)) {
      case null 0;
      case (?records) {
        var totalHours : Int = 0;
        for (record in List.toArray(records).vals()) {
          if (record.date >= startDate and record.date <= endDate) {
            switch (record.hoursWorked) {
              case (?hours) totalHours += hours;
              case null {
                switch (record.status) {
                  case (#present) totalHours += 8;
                  case (#remoteWork) totalHours += 8;
                  case _ {};
                };
              };
            };
          };
        };
        totalHours;
      };
    };
  };

  // Calculate total hours worked for all users (admin only)
  public query ({ caller }) func calculateTotalHoursForAllUsers(startDate : Time.Time, endDate : Time.Time) : async [(Principal, Int)] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono visualizzare le ore totali lavorate");
    };
    let entries = Iter.toArray(principalMap.entries(attendanceRecords));
    var totalHoursList = List.nil<(Principal, Int)>();

    for ((user, records) in entries.vals()) {
      var userTotalHours : Int = 0;
      for (record in List.toArray(records).vals()) {
        if (record.date >= startDate and record.date <= endDate) {
          switch (record.hoursWorked) {
            case (?hours) userTotalHours += hours;
            case null {
              switch (record.status) {
                case (#present) userTotalHours += 8;
                case (#remoteWork) userTotalHours += 8;
                case _ {};
              };
            };
          };
        };
      };
      totalHoursList := List.push((user, userTotalHours), totalHoursList);
    };

    List.toArray(totalHoursList);
  };

  // Helper function to format date in Italian "DD/MM/YYYY"
  func formatDateItalian(timestamp : Time.Time) : Text {
    let nanosecondsPerDay : Int = 24 * 60 * 60 * 1000000000;
    let daysSinceEpoch : Int = timestamp / nanosecondsPerDay;
    let referenceDay : Int = 3; // 1 gennaio 1970 era un giovedì
    let daysSinceReference : Int = daysSinceEpoch + referenceDay;

    let year = 1970 + (daysSinceReference / 365);
    let remainingDays = daysSinceReference % 365;

    let month = 1 + (remainingDays / 30);
    let day = 1 + (remainingDays % 30);

    let dayStr = if (day < 10) "0" # Int.toText(day) else Int.toText(day);
    let monthStr = if (month < 10) "0" # Int.toText(month) else Int.toText(month);

    dayStr # "/" # monthStr # "/" # Int.toText(year);
  };

  // Export attendance records as CSV (admin only)
  public query ({ caller }) func exportAttendanceRecordsAsCSV() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono esportare i record di presenza");
    };
    let entries = Iter.toArray(principalMap.entries(attendanceRecords));
    var csv = "Nome,Data,Ora Inizio,Ora Fine,Durata Pausa (min),Ore Lavorate,Stato,Attività,Note,Timestamp\n";

    for ((user, records) in entries.vals()) {
      for (record in List.toArray(records).vals()) {
        let name = switch (principalMap.get(userProfiles, user)) {
          case null "Sconosciuto";
          case (?profile) profile.name;
        };
        let date = formatDateItalian(record.date);
        let startTime = switch (record.startTime) {
          case null "";
          case (?t) t;
        };
        let endTime = switch (record.endTime) {
          case null "";
          case (?t) t;
        };
        let breakDuration = switch (record.breakDuration) {
          case null "";
          case (?d) Int.toText(d);
        };
        let hoursWorked = switch (record.hoursWorked) {
          case null "";
          case (?h) Int.toText(h);
        };
        let status = switch (record.status) {
          case (#present) "Presente";
          case (#absent) "Assente";
          case (#remoteWork) "Lavoro da remoto";
          case (#holiday) "Ferie";
          case (#law104Leave) "Permesso 104";
          case (#sickness) "Malattia";
          case (#timeBank) "Banca ore";
        };
        let activity = switch (record.activity) {
          case (#project(project)) "Progetto: " # project;
          case (#service(service)) "Servizio: " # service;
          case (#genericActivity(activity)) "Attività: " # activity;
          case (#weekend) "Weekend";
          case (#workshops) "Workshop";
        };
        let notes = switch (record.notes) {
          case null "";
          case (?n) n;
        };
        let timestamp = formatDateItalian(record.timestamp);

        csv := csv # name # "," # date # "," # startTime # "," # endTime # "," # breakDuration # "," # hoursWorked # "," # status # "," # activity # "," # notes # "," # timestamp # "\n";
      };
    };

    csv;
  };

  // Export holiday requests as CSV (admin only)
  public query ({ caller }) func exportHolidayRequestsAsCSV() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono esportare le richieste ferie");
    };
    let requests = Iter.toArray(natMap.vals(holidayRequests));
    var csv = "Nome,Data Inizio,Data Fine,Stato,Motivo\n";

    for (request in requests.vals()) {
      let name = switch (principalMap.get(userProfiles, request.user)) {
        case null "Sconosciuto";
        case (?profile) profile.name;
      };
      let startDate = formatDateItalian(request.startDate);
      let endDate = formatDateItalian(request.endDate);
      let status = switch (request.status) {
        case (#pending) "In attesa";
        case (#approved) "Approvato";
        case (#rejected) "Rifiutato";
      };
      let reason = request.reason;

      csv := csv # name # "," # startDate # "," # endDate # "," # status # "," # reason # "\n";
    };

    csv;
  };

  // Export permission requests as CSV (admin only)
  public query ({ caller }) func exportPermissionRequestsAsCSV() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Debug.trap("Non autorizzato: solo gli amministratori possono esportare le richieste permessi");
    };
    let requests = Iter.toArray(natMap.vals(permissionRequests));
    var csv = "Nome,Data Inizio,Data Fine,Stato,Motivo,Tipo Richiesta\n";

    for (request in requests.vals()) {
      let name = switch (principalMap.get(userProfiles, request.user)) {
        case null "Sconosciuto";
        case (?profile) profile.name;
      };
      let startDate = formatDateItalian(request.startDate);
      let endDate = formatDateItalian(request.endDate);
      let status = switch (request.status) {
        case (#pending) "In attesa";
        case (#approved) "Approvato";
        case (#rejected) "Rifiutato";
      };
      let reason = request.reason;
      let requestType = switch (request.requestType) {
        case (#generic) "Generico";
        case (#medical) "Medico";
        case (#familyEmergency) "Emergenza familiare";
      };

      csv := csv # name # "," # startDate # "," # endDate # "," # status # "," # reason # "," # requestType # "\n";
    };

    csv;
  };
};
