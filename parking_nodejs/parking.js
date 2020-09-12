var moment = require('moment');
let mysql = require('mysql');

const createResponse = (statusCode, body) => {
    return {
        "isBase64Encoded": false,
        "headers": {
            'content-type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        "statusCode": statusCode,
        "body": JSON.stringify( body ) || ""
    }
};

exports.masterData = (event, context, callback) =>
{
    console.log( "Context  :: " + JSON.stringify(context)  )
    console.log( 'Event Object (string) : ' + JSON.stringify(event) )

    //prevent timeout from waiting event loop
    context.callbackWaitsForEmptyEventLoop = false;

    console.log( 'Database Host : ' + process.env.dbHost );
    console.log( 'Database Name : ' + process.env.dbName );
    console.log( 'Database Admin : ' + process.env.dbUser );
    console.log( 'Database Password : ' + process.env.dbPass );

    pool = mysql.createPool({
                host     : process.env.dbHost,
                database : process.env.dbName,
                user     : process.env.dbUser,
                password : process.env.dbPass,
    });

    pool.getConnection(function(err, connection)
    {
        if (err)
        {
            console.log( 'Error in DB connection reading Parking Master data : ' + err );
            callback( err )
        }
        var data = null;
        var deviceAddressMaster = process.env.deviceAddressMaster;
        var parkingAddressMpg = process.env.parkingAddressMpg;
        var parkingMaster = process.env.parkingMaster;
        var zipcode = event.pathParameters.zipcodeValue;

        console.log( 'Device Address Table: ' + deviceAddressMaster )
        console.log( 'Parking Master Table: ' + parkingMaster )
        console.log( 'Parking Address Mapping Table: ' + parkingAddressMpg )
        console.log( 'Zipcode: ' + zipcode )

        var sql = "SELECT * FROM " + deviceAddressMaster + " address join " + parkingAddressMpg + " mpg " +
                  "on mpg.address_id = address.address_id " +
                  "join " + parkingMaster + " parking on parking.parking_id = mpg.parking_id " +
                  "where trim(zipcode) = '"+zipcode+"' ";

        connection.query( sql,

            function (error, results, fields)
            {
                connection.release();

                if (error)
                {
                    console.log( 'Error in read parking master data query >> ' + error )
                    callback( createResponse( 500, error ) );
                }
                else
                {
                    console.log( 'Success (Read parking master data) :' + JSON.stringify( results ) )

                    if( results && results.length>0 )
                    {
                        populateMasterData( results, callback )
                    }
                    else
                    {
                        callback(null, createResponse( 404, "No Data Found" ) );
                    }
                }
            }
        );

    });

};


function populateMasterData( data, callback )
{
    console.log( 'Populating Parking Master Data... START...' )

    var resultList = [];
    var location = [];

    if( data && data.length )
    {
        data.forEach(element => {
            location = JSON.parse( element.location ).map(Number);
            var item =
            {
                "location": location,
                "latitude": location[0],
                "longitude": location[1],
                "address": element.address + ", " + element.city + " " + element.state + " " + element.zipcode,
                "zipcode": element.zipcode,
                "area_code": element.area_code,
                "parking_id": element.parking_id,
                "parking_name": element.parking_name
            }
            resultList.push( item );
        });
    }
    else {
        callback(null, createResponse( 404, "No Data Found" ) );
    }

    console.log( 'Populating Parking Master Data... END...' )

    callback(null, createResponse( 200, resultList ) );
}

exports.getAll =  (event, context, callback) => 
{
    console.log( "Context  :: " + JSON.stringify(context)  )
    console.log( 'Event Object (string) : ' + JSON.stringify(event) )

    //prevent timeout from waiting event loop
    context.callbackWaitsForEmptyEventLoop = false;

    console.log( 'Database Host : ' + process.env.dbHost );
    console.log( 'Database Name : ' + process.env.dbName );
    console.log( 'Database Admin : ' + process.env.dbUser );
    console.log( 'Database Password : ' + process.env.dbPass );

    pool = mysql.createPool({
                host     : process.env.dbHost,
                database : process.env.dbName,
                user     : process.env.dbUser,
                password : process.env.dbPass,
    });

    // Read existing entry for status change
    pool.getConnection(function(err, connection) 
    {
        if (err)
        {
            console.log( 'Error in DB connection during read existing data : ' + err );
            callback( err )
        }
        var data = null;

        var queryExtention = ' WHERE '
        var conditions = []

        var deviceStatusTable = process.env.deviceStatusTable;
        var deviceMasterTable = process.env.deviceMasterTable;
        var deviceAddressMpg = process.env.deviceAddressMpg;
        var deviceAddressMaster = process.env.deviceAddressMaster;

        var state = event.queryStringParameters ? event.queryStringParameters.state : '';
        var city = event.queryStringParameters ? event.queryStringParameters.city : '';
        var zipcode = event.queryStringParameters ? event.queryStringParameters.zipcode : '';
        var address = event.queryStringParameters ? event.queryStringParameters.address : '';
        var isOccupied = event.pathParameters ? event.pathParameters.isoccupiedValue : '';
        var code = event.pathParameters ? event.pathParameters.areaCodeValue : '';
        var zipcode = event.pathParameters ? event.pathParameters.zipCodeValue : '';

        console.log( 'DeviceStatusTable >> ' + deviceStatusTable )
        console.log( 'DeviceMasterTable >> ' + deviceMasterTable )
        console.log( 'State >> ' + state )
        console.log( 'City >> ' + city )
        console.log( 'Zipcode >> ' + zipcode )
        console.log( 'Address Line >> ' + address )
        console.log( 'IsOccupied >> ' + isOccupied )
        console.log( 'Area/Parking Code >> ' + code )
        console.log( 'Zip Code >> ' + zipcode )

        if( state ) conditions.push( " upper( master.state ) = '" + state.toUpperCase() + "' " );
        if( city ) conditions.push( " upper( master.city ) = '" + city.toUpperCase() + "' " );
        if( address ) conditions.push( " upper( master.address ) = '" + address.toUpperCase() + "' " );
        //if( zipcode ) conditions.push( " upper( master.zipcode ) = '" + zipcode.toUpperCase() + "' " );
        if( isOccupied ) conditions.push( " status.IsOccupied = '" + isOccupied + "' ");
        if( code ) conditions.push( " address.area_code = '" + code + "' ");
        if( zipcode ) conditions.push( " address.zipcode = '" + zipcode + "' ");

        var sql = "select address.address, address.city, address.state, address.zipcode, address.location, " +
                    "status.IsOccupied, status.status, status.comment,  master.meter_no, status.timestamp, " +
                    "status.parking_start_time, status.parking_end_time, status.BatteryLife, status.user_code, status.scan " +
                    "from " +
                    deviceMasterTable + " master join " + deviceStatusTable + " status " +
                    "on status.serial_number = master.serial_number join " +
                    deviceAddressMpg + " mpg on mpg.device_id = master.device_id join " +
                    deviceAddressMaster + " address on address.address_id = mpg.address_id ";

        if( conditions && conditions.length > 0 )
        {
            conditions.forEach( element => {
                
                queryExtention = queryExtention + element;

                if( conditions[conditions.length-1] != element){
                    queryExtention = queryExtention + " AND "
                }
            } )

            console.log( "Query Extention : " + queryExtention )

            sql = sql + queryExtention

            console.log( "FINAL Query : " + sql )
        }

        connection.query( sql, 

            function (error, results, fields) 
            {
                connection.release();
                
                if (error) 
                {
                    console.log( 'Error in read status query >> ' + error )
                    callback( createResponse( 500, error ) );
                }
                else 
                {
                    console.log( 'Success Obj :' + results )
                    console.log( 'Success (Read status) :' + JSON.stringify( results ) )
                    populateData( results, callback )
                }
            }
        );
    }); // DB Operation done!
    
};
  
function populateData( data, callback )
{
    console.log( 'Populating data to generate custom response... START...' )

    var resultList = [];

    if( data && data.length )
    {
        data.forEach(element => {
            var item = 
            {
                "timestamp": element.timestamp,
                "isOccupied": ( element.IsOccupied == 0 ? false : true ),
                "meter" : {
                    "number": element.meter_no,
                    "location": JSON.parse( element.location ).map(Number) ,
                    "address": element.address + ", " + element.city + " " + element.state + " " + element.zipcode
                },
                "parkingTime": {
                    "startTime" : element.parking_start_time,
                    "endTime" : element.parking_end_time
                },
                "deviceStatus": {
                     "batteryLife": element.BatteryLife,
                     "status": ( element.status != null ? element.status : '' )
                },
                "userStatus": {
                     "scan": element.scan,
                     "userCode": ( element.user_code != null ? element.user_code : '' )
                }
            }
            resultList.push( item );
        });
    }
    else {
        callback(null, createResponse( 404, "No Data Found" ) );
    }

    console.log( 'Populating data to generate custom response... END...' )
    
    callback(null, createResponse( 200, resultList ) );
}

function publishCallback(err, data) {
    console.log( 'Publish callback...' ) 
    console.log(err);
    console.log(data);
}
