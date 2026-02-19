import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import List "mo:base/List";
import Time "mo:base/Time";
import InviteLinksModule "invite-links/invite-links-module";
import Text "mo:base/Text";

module {
  type OldUserProfile = {
    name : Text;
    position : Text;
    isEmployee : Bool;
    holidayBalance : Nat;
  };

  type OldAttendanceStatus = {
    #present;
    #absent;
    #remoteWork;
    #holiday;
    #law104Leave;
    #sickness;
    #timeBank;
  };

  type OldActivityType = {
    #project : Text;
    #service : Text;
    #genericActivity : Text;
    #weekend;
    #workshops;
  };

  type OldAttendanceRecord = {
    id : Nat;
    date : Time.Time;
    status : OldAttendanceStatus;
    activity : OldActivityType;
    startTime : ?Text;
    endTime : ?Text;
    breakDuration : ?Nat;
    hoursWorked : ?Nat;
    notes : ?Text;
    timestamp : Time.Time;
  };

  type OldAttendanceModification = {
    recordId : Nat;
    modifiedBy : Principal;
    modificationType : {
      #created;
      #updated;
      #deleted;
    };
    timestamp : Time.Time;
    oldRecord : ?OldAttendanceRecord;
    newRecord : ?OldAttendanceRecord;
  };

  type OldHolidayRequest = {
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

  type OldPermissionRequest = {
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

  type OldActor = {
    var nextHolidayRequestId : Nat;
    var nextPermissionRequestId : Nat;
    var nextAttendanceRecordId : Nat;
    var userProfiles : OrderedMap.Map<Principal, OldUserProfile>;
    var attendanceRecords : OrderedMap.Map<Principal, List.List<OldAttendanceRecord>>;
    var attendanceModifications : OrderedMap.Map<Principal, List.List<OldAttendanceModification>>;
    var holidayRequests : OrderedMap.Map<Nat, OldHolidayRequest>;
    var permissionRequests : OrderedMap.Map<Nat, OldPermissionRequest>;
    inviteState : InviteLinksModule.InviteLinksSystemState;
  };

  type NewActor = {
    var nextHolidayRequestId : Nat;
    var nextPermissionRequestId : Nat;
    var nextAttendanceRecordId : Nat;
    var userProfiles : OrderedMap.Map<Principal, OldUserProfile>;
    var attendanceRecords : OrderedMap.Map<Principal, List.List<OldAttendanceRecord>>;
    var attendanceModifications : OrderedMap.Map<Principal, List.List<OldAttendanceModification>>;
    var holidayRequests : OrderedMap.Map<Nat, OldHolidayRequest>;
    var permissionRequests : OrderedMap.Map<Nat, OldPermissionRequest>;
    inviteState : InviteLinksModule.InviteLinksSystemState;
  };

  public func run(old : OldActor) : NewActor {
    {
      var nextHolidayRequestId = old.nextHolidayRequestId;
      var nextPermissionRequestId = old.nextPermissionRequestId;
      var nextAttendanceRecordId = old.nextAttendanceRecordId;
      var userProfiles = old.userProfiles;
      var attendanceRecords = old.attendanceRecords;
      var attendanceModifications = old.attendanceModifications;
      var holidayRequests = old.holidayRequests;
      var permissionRequests = old.permissionRequests;
      inviteState = old.inviteState;
    };
  };
};
