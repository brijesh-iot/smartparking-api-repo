let mysql  = require('mysql');
let config = require('./config.js');
let connection = mysql.createConnection(config);


exports.handler = async (event, context, callback) =>
{
    console.log( "connection  :: " + connection  )
    
    console.log( "Context  :: " + JSON.stringify(context)  )
    console.log( 'Event Object (string) : ' + JSON.stringify(event) )
    
    connection.connect(function(err) {
        if (err) throw err;
        // if connection is successful
        var records = [
          [
            event.serial_number,
            event.asset,
            event.asset_type,
            event.location,
            event.meter,
            event.address,
            event.city,
            event.state,
            event.iot_birth_rule_cloud,
            event.iot_birth_rule_edge,
            event.iot_data_rule_cloud,
            event.iot_data_rule_edge,
            event.guid,
            event.timestamp
          ]
        ];
        con.query(`INSERT INTO AWS_PARKING_DEVICE_MASTER(
            serial_number,
            asset,
            asset_type,
            location,
            meter,
            address,
            city,
            state,
            iot_birth_rule_cloud,
            iot_birth_rule_edge,
            iot_data_rule_cloud,
            iot_data_rule_edge,
            guid,
            timestamp) VALUES ?`, 
            [records], 
            function (err, result, fields) 
            {
                // if any error while executing above query, throw error
                if (err) 
                {
                    connection.end();
                    publishCallback(err, result);
                    throw err;
                }
                // if there is no error, you have the result
                console.log(result);
                publishCallback(err, result);
            });
      });

    

}



function publishCallback(err, data) {
    console.log( 'Publish callback...' ) 
    console.log(err);
    console.log(data);
}





    

// insert statment
//    let sql = `INSERT INTO AWS_PARKING_DEVICE_MASTER(
//        serial_number,
//        asset,
//        asset_type,
//        location,
//        meter,
//        address,
//        city,
//        state,
//        iot_birth_rule_cloud,
//        iot_birth_rule_edge,
//        iot_data_rule_cloud,
//        iot_data_rule_edge,
//        guid,
//        timestamp)
//    VALUES( event.serial_number )`;
//
//    // execute the insert statment
//    //connection.query(sql);

