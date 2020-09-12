var AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION });
var docClient = new AWS.DynamoDB.DocumentClient();

exports.getAll = (event,context,callback) => {

    console.log( "Environment Object : " + JSON.stringify( process.env ) )
    console.log( "Event Object : " + JSON.stringify( event ) )

    var alertsTableName = process.env.alertsTableName;
    console.log( 'SmartParking--- Alerts/Warnings Table Name : ' + alertsTableName )

    var code = 32771

    var params = {
        TableName: alertsTableName,
        IndexName: "ZIP-index",
        FilterExpression: "zipcode = :code",
        //KeyConditionExpression: "#zip = :code",
        //ExpressionAttributeNames:{
        //    "#zip": "zipcode"
        //},
        ExpressionAttributeValues: {
            ":code": code
        },
        ProjectionExpression:"zipcode, serial_number, address, alert_name, event_name, event_data, event_state, event_time"
    };

    console.log( "Scanning dynamodb table." );
    docClient.scan( params, onScan );

    function onScan( err, data )
    {
        if (err)
        {
            console.error( "Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2) );
            callback( null, createResponse( 404, "No Data Found" ) );
        }
        else
        {
            console.log( "Scan succeeded." );
            console.log( "GetItem succeeded:", JSON.stringify(data, null, 2) );
            populateData( data, callback  )

            // continue scanning if we have more data, because scan can retrieve a maximum of 1MB of data
            if (typeof data.LastEvaluatedKey != "undefined") {
                console.log("Scanning for more...");
                params.ExclusiveStartKey = data.LastEvaluatedKey;
                docClient.scan(params, onScan);
            }
        }
    }

   /* docClient.query(params, function(err, data) {
        if (err)
        {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                callback(null, createResponse( 404, "No Data Found" ) );
        }
        else
        {
                console.log("Query succeeded.");
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                callback(null, createResponse( 200, data ) );
        }
    });*/

};

function populateData( data, callback )
{
    console.log( 'Populating data to generate custom response... START...' )

    var resultList = [];

    if( data )
    {
        data.Items.forEach(element => {
            var item =
            {
                "zipcode": element.zipcode,
                "eventData": element.event_data,
                "eventState" : element.event_state,
                "address" : element.address,
                "alertName" : element.alert_name,
                "eventName" : element.event_name,
                "eventState" : element.event_state,
                "serialNumber" : element.serial_number,
                "timestamp" : element.event_time
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