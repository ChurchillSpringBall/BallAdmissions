// #### INCLUDES ####
var express = require('express');
var app = express();
var Sequelize  = require('sequelize');

// #### CONFIG ####
var config = {
    db: {
        host: 'localhost',
        name: 'springball',
        username: 'springball',
        password: 'springball',
        port: 5432
    },
    webserver: {
        port: 5000
    }
}

// #### SEQUELIZE ####
var sequelize = new Sequelize(config.db.name, config.db.username, config.db.password, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
});

var Ticket = sequelize.define('ticket', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    crsid: {
        type: Sequelize.STRING,
        allowNull: false
    },
    queueJump: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    },
    barcode: {
        type: Sequelize.STRING,
        allowNull: false
    },
    admitted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    dateAdmitted: {
        type: Sequelize.DATE,
        allowNull: true
    }
}, {
    freezeTableName: true // Model tableName will be the same as the model name
});

// #### EXPRESS ####
app.get('/barcode/:barcode', function(req, res) {
    if (req.params.barcode == null) {
        res.json({ error: true, message: 'You must specify a barcode' });
        return;
    }

    Ticket.findOne({
        where: {
            barcode: req.params.barcode
        }
    }).then(function(ticket) {
        if (ticket == null) {
            res.json({ error: true, message: 'Not found in database' });
        } else if (ticket.admitted) {
            res.json({ error: true, message: 'Ticket already admitted' });
        } else {
            ticket.update({
                admitted: true,
                dateAdmitted: new Date()
            }).then(function(ticket) {
                res.json(ticket);
            })
        }
    })
});

// #### IMPORT ####
var importCSV = function() {
    var lineReader = require('readline').createInterface({
        input: require('fs').createReadStream('tickets.csv')
    });

    lineReader.on('line', function (line) {
        var person = line.split(',');
        Ticket.create({
            name: person[0],
            crsid: person[1],
            queueJump: person[2] == 'QJ',
            barcode: person[3]
        }).then(function(ticket) {
            console.log(ticket.get({
                plain: true
            }));
        });
    });
}

// #### LAUNCH ####
console.log('Launching server');
sequelize.sync({force: false}).then(function() {
    console.log('Sequelize sync complete');
    app.listen(config.webserver.port, function() {
        console.log('Server started on port ' + config.webserver.port.toString());
    });
});
