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

function myFunction() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var header = ss.getRange('A1');
  var cell = ss.getRange('A2');
  var conn = Jdbc.getConnection("jdbc:mysql://78.47.22.238:3306/traccart", "user", "pass@unidatabases");
  var start = new Date();
  var stmt = conn.createStatement();
  stmt.setMaxRows(1000);
//  var results = stmt.executeQuery('SELECT d.name, d.lastUpdate, p.deviceId, p.serverTime, p.deviceTime, p.fixTime, p.latitude, p.longitude, p.altitude, p.speed, p.course, p.address FROM position p, user_device du, device d WHERE du.deviceId=p.deviceId AND du.deviceId=d.id AND du.userId=2;');
  var results = stmt.executeQuery('SELECT d.id, d.name, d.status, d.lastUpdate, p.speed, p.address, p.other FROM device d LEFT JOIN position p ON d.positionId = p.id;');
  var numCols = results.getMetaData().getColumnCount();
  var row = 0;
  while (results.next()) {
    var rowString = '';
    for (var col = 0; col < numCols; col++) {
      cell.offset(row, col).setValue(results.getString(col+1));
//      rowString += results.getString(col + 1) + '\t';
    }
    row++;
//    Logger.log(rowString)
  }

  var col = 7, c=7;
  
  var results = stmt.executeQuery('SELECT DATE(fixTime) as date FROM position GROUP BY date ORDER BY date;');
  var numCols = results.getMetaData().getColumnCount();
  while (results.next()) {
    header.offset(0, c++).setValue(results.getString(1));
  }
  
//  SELECT DATE(fixTime) as date FROM position GROUP BY date ORDER BY date;
  
//  for(var r = 0; r < row; r++){
//    var id = cell.offset(r, 0).getValue();
//    cell.offset(r, 7).setValue(get_dispance(50.51073, 30.41952, 50.510695, 30.419486666666668));
//  }
  
  results.close();
  stmt.close();
}
