var SIDEBAR_TITLE = 'Get Information';

function onOpen(e) {
  SpreadsheetApp.getUi()
      .createAddonMenu()
      .addItem('Show sidebar', 'showSidebar')
      .addItem('Zone information', 'getZoneInformation')
      .addToUi();
  showSidebar();
}

function onInstall(e) {
  onOpen(e);
}

function getZoneInformation() {
  var ui = HtmlService.createTemplateFromFile('getZoneInformation')
      .evaluate()
      .setTitle('Получить информацию о зонах');
  SpreadsheetApp.getUi().showSidebar(ui);
}

function showSidebar() {
  var ui = HtmlService.createTemplateFromFile('Sidebar')
      .evaluate()
      .setTitle(SIDEBAR_TITLE);
  SpreadsheetApp.getUi().showSidebar(ui);
}

function getActiveValue() {
  var cell = SpreadsheetApp.getActiveSheet().getActiveCell();
  return cell.getValue();
}

function getActiveCell() {
  return SpreadsheetApp.getActiveSheet().getActiveCell();
}

function setActiveValue(value) {
  var cell = SpreadsheetApp.getActiveSheet().getActiveCell();
  cell.setValue(value);
}

function get_dispance(lat1, long1, lat2, long2) {
  var rad = 6372795;

  lat1 = lat1 * Math.PI / 180;
  long1 = long1 * Math.PI / 180;
  lat2 = lat2 * Math.PI / 180;
  long2 = long2 * Math.PI / 180;
  
  var cl1 = Math.cos(lat1);
  var cl2 = Math.cos(lat2)
  var sl1 = Math.sin(lat1)
  var sl2 = Math.sin(lat2)
  var delta = long2 - long1;
  var cdelta = Math.cos(delta);
  var sdelta = Math.sin(delta);
  
  var y = Math.sqrt(Math.pow(cl2*sdelta, 2) + Math.pow(cl1*sl2-sl1*cl2*cdelta, 2));
  var x = sl1 * sl2 + cl1 * cl2 * cdelta;
  
  var ad = Math.atan2(y, x);
  var dist = ad * rad / 1000.0;
  return dist;
}



function myFunction(value, value2) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var sheet1 = ss.getSheetByName('Sheet1');

  var cell = sheet1.getRange('A2');
  var conn = Jdbc.getConnection("jdbc:mysql://server", "user", "pswd");
  var start = new Date();
  var stmt = conn.createStatement();
  stmt.setMaxRows(1000);
  var results = stmt.executeQuery('SELECT d.id, d.name, d.status, CONVERT_TZ(`d`.`lastUpdate`, \'+00:00\',\'+03:00\'), p.speed, p.address, p.other FROM device d LEFT JOIN position p ON d.positionId = p.id;');
  var numCols = results.getMetaData().getColumnCount();
  var row = 0;
  while (results.next()) {
    var rowString = '';
    for (var col = 0; col < numCols; col++) {
      if(col == 2)
        continue;
      cell.offset(row, col).setValue(results.getString(col+1));
    }
    row++;
  }
  
  for(var r = 0; r < row; r++){
    var id = cell.offset(r, 0).getValue();
    var distance = 0;
    var workTime = 0;
    var engineTime = 0;
    var last_engine = 0;
    var tracker_present = 0;
    
    var tmp_latitude = null;
    var tmp_longitude = null;
    var tmp_speed = null;
    var tmp_time = null;
    var tmp_time2 = null;
    var new_latitude = null;
    var new_longitude = null;
    var new_speed = null;
    var new_time = null
    var new_time2 = null
    stmt = conn.prepareStatement('SELECT latitude, longitude, speed, UNIX_TIMESTAMP(fixTime), other FROM position WHERE deviceId=? AND fixTime>=? AND fixTime<DATE_ADD(?, INTERVAL 1 DAY) ORDER BY fixTime;');
    stmt.setString(1, id);
    stmt.setString(2, value);
    stmt.setString(3, value2);

    results = stmt.executeQuery();
    while (results.next()) {
      new_latitude = parseFloat(results.getString(1));
      new_longitude = parseFloat(results.getString(2));
      new_speed = parseFloat(results.getString(3));
      new_time = parseFloat(results.getString(4));
      new_time2 = results.getString(5);

      if (new_time2.indexOf('tracker') > -1) {
        tracker_present = 1;
      } else {
        tracker_present = 0;
      }

      if(tmp_latitude == new_latitude && tmp_longitude == new_longitude){
      }else if(tmp_latitude != null) {
        var tmpdistance = get_dispance(tmp_latitude, tmp_longitude, new_latitude, new_longitude);
        distance += tmpdistance;
        if(tmpdistance > 0.010 && last_engine==1 && tracker_present==1){
          workTime += (new_time-tmp_time)/3600;
        }
      }

      if(last_engine==0 && tracker_present==1){
        last_engine=1;
      }else if(last_engine==1 && tracker_present==1){
        engineTime += (new_time-tmp_time)/3600;
      }else if(last_engine==1 && tracker_present==0){
        engineTime += (new_time-tmp_time)/3600;
        last_engine=0;
      }else{}
      tmp_latitude = new_latitude;
      tmp_longitude = new_longitude;
      tmp_speed = new_speed;
      tmp_time = new_time;
      tmp_time2 = new_time2;
    }
    cell.offset(r, 7).setValue(workTime);
    cell.offset(r, 8).setValue(distance);
    cell.offset(r, 9).setValue(engineTime);
  }
  
  results.close();
  stmt.close();
}


function myFunctionZones(value, value2) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Информация по зонам');
  var cell = sheet.getRange('A2');
//  cell.offset(0, 17).setValue('1111111111');
  var conn = Jdbc.getConnection("jdbc:mysql://server", "user", "pswd");
  var start = new Date();
  var stmt = conn.createStatement();
  stmt.setMaxRows(1000);
  
  var deviceId = null;
  var deviceName = null;
  var polId = null;
  var polName = null;
  var fixTime = null;
  var inZone = null;
  
  var stmt = conn.createStatement();
  
  var results = stmt.executeQuery('SELECT d.id as `deviceId`, d.name, p.id as `polygonId`, p.name FROM `device` d INNER JOIN `polygon` p ON p.deviceId=d.id;');
  var numCols = results.getMetaData().getColumnCount();
  var row = 0;
  while (results.next()) {
    var rowString = '';
    for (var col = 0; col < numCols; col++) {
      cell.offset(row, col).setValue(results.getString(col+1));
    }
    row++;
  }

  var last_row = 0;
  for(var r = 0; r < row; r++){
    var dId = cell.offset(r, 0).getValue();
    var pId = cell.offset(r, 2).getValue();

    var tmp_latitude = null;
    var tmp_longitude = null;
    var new_latitude = null;
    var new_longitude = null;

    var out_time = 0;
    var in_time = 0;
    var old_time = null;
    
    var new_time = null;
    var inPos = null;
    var oldPos = null;

    var distance_in = 0;
    var distance_out = 0;
    var c_in = 0;
    var c_out = 0;
    
    stmt = conn.prepareStatement("SELECT UNIX_TIMESTAMP(pos.fixTime), IF(CONTAINS(`p`.`pol`, GeomFromText(CONCAT('POINT(', `pos`.`longitude`, ' ', `pos`.`latitude`, ')'))), 1, 0) as `in`, `pos`.`latitude`, `pos`.`longitude` FROM `polygon` p INNER JOIN `position` pos ON pos.deviceId=p.deviceId WHERE p.deviceId=? AND p.id=? AND pos.fixTime>=? AND pos.fixTime<DATE_ADD(?, INTERVAL 1 DAY) ORDER BY fixTime;");
    stmt.setString(1, dId);
    stmt.setString(2, pId);
    stmt.setString(3, value);
    stmt.setString(4, value2);

    results = stmt.executeQuery();
    while (results.next()) {
      new_time = results.getString(1)
      inPos = parseFloat(results.getString(2));
      new_latitude = parseFloat(results.getString(3));
      new_longitude = parseFloat(results.getString(4));
      
      if (oldPos != null && oldPos != inPos){
        if (inPos == 1){
          c_in += 1;
        } else {
          c_out += 1;
        }
      }

      if(tmp_latitude == new_latitude && tmp_longitude == new_longitude){
      }else if(tmp_latitude != null) {
        var tmpdistance = get_dispance(tmp_latitude, tmp_longitude, new_latitude, new_longitude);
        if (inPos == 1){
          distance_in += tmpdistance;
        } else {
          distance_out += tmpdistance;
        }
      }
      
      if(old_time != null) {
        if(inPos == 1){
          in_time += (new_time-old_time)/3600;
        } else {
          out_time += (new_time-old_time)/3600;
        }
      }
      old_time = new_time;
      oldPos = inPos;
      tmp_latitude = new_latitude;
      tmp_longitude = new_longitude;
    }
    cell.offset(r, 4).setValue(in_time);
    cell.offset(r, 5).setValue(out_time);
    cell.offset(r, 6).setValue(c_in);
    cell.offset(r, 7).setValue(c_out);
    cell.offset(r, 8).setValue(distance_in);
    cell.offset(r, 9).setValue(distance_out);
    
    last_row = r;
  }
  
  for(var r = last_row+1; r < 1000; r++){
    if(cell.offset(r, 0).getValue() == ""){
      break;
    }
    cell.offset(r, 0).setValue("");
    cell.offset(r, 1).setValue("");
    cell.offset(r, 2).setValue("");
    cell.offset(r, 3).setValue("");
    cell.offset(r, 4).setValue("");
    cell.offset(r, 5).setValue("");
    cell.offset(r, 6).setValue("");
    cell.offset(r, 7).setValue("");
    cell.offset(r, 8).setValue("");
    cell.offset(r, 9).setValue("");
  }
  results.close();
  stmt.close();
}
