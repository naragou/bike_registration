const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');

const cors = require('cors');
const app = express();
const PORT = 1616 ;

// 데이터베이스 연결 설정
const db = mysql.createConnection({
    host: 'localhost',
    user: 'pedarling_test',
    password: 'pedarling1616',
    port: 3306,
    database: 'pedarling_test'
});

// 데이터베이스 연결
db.connect(err => {
    if (err) {
        console.error('Error connecting: ' + err.stack);
        return;
    }
    console.log('Database connected as id ' + db.threadId);
});

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('/var/www/html/pedarling_test'));  // 'public' 디렉터리를 정적 파일로 설정

// 루트 경로에서 index.html 파일을 제공
app.get('/', function (req, res) {
    res.sendFile('/var/www/html/pedarling_test/index.html');
});

// 자전거 등록 처리
// 자전거 종류와 주소에 대한 코드 조회 로직을 추가함
function getCodeForBikeType(bikeType, callback) {
    // 데이터베이스에서 자전거 종류에 대한 코드를 조회함
    const query = `SELECT code FROM BikeTypes WHERE bikeType = ?`;
    db.query(query, [bikeType], (error, results) => {
        if (error) return callback(error, null);
        return callback(null, results[0].code);
    });
}

function getCodeForAddress(city, district, callback) {
    // 데이터베이스에서 주소에 대한 코드를 조회함
    const query = `SELECT code FROM AddressCodes WHERE city = ? AND district = ?`;
    db.query(query, [city, district], (error, results) => {
        if (error) return callback(error, null);
        return callback(null, results[0].code);
    });
}

// 자전거 등록 처리
app.post('/register', (req, res) => {
    const { serialNumber, ownerName, city, district, phoneNumber, bikeType } = req.body;

    getCodeForBikeType(bikeType, (error, bikeTypeCode) => {
        if (error) {
            console.error('Failed to get bike type code:', error);
            return res.status(500).json({ message: 'Error registering bicycle', error: error.message });
        }

        getCodeForAddress(city, district, (error, addressCode) => {
            if (error) {
                console.error('Failed to get address code:', error);
                return res.status(500).json({ message: 'Error registering bicycle', error: error.message });
            }

            // 주소를 문자열로 조합
            const fullAddress = `${city} ${district}`;

            // 일련번호를 얻기 위한 쿼리
            const countQuery = `SELECT COUNT(*) AS count FROM Bicycles WHERE address = ? AND bikeType = ?`;
            db.query(countQuery, [fullAddress, bikeType], (error, results) => {
                if (error) {
                    console.error('Failed to retrieve count:', error);
                    return res.status(500).json({ message: 'Error generating registration code', error: error.message });
                }

                // 새 일련번호 생성
                let newSerialNumber = results[0].count + 1;
                newSerialNumber = newSerialNumber.toString().padStart(6, '0'); // 6자리 숫자로 변환

                // 전체 등록 코드 생성
                const registrationCode = `${addressCode}-${bikeTypeCode}-${newSerialNumber}`;

                // 데이터베이스에 데이터 삽입하는 쿼리
                const insertQuery = `INSERT INTO Bicycles (serialNumber, ownerName, address, phoneNumber, bikeType, registrationCode) VALUES (?, ?, ?, ?, ?, ?)`;
                db.query(insertQuery, [serialNumber, ownerName, fullAddress, phoneNumber, bikeType, registrationCode], (error, results) => {
                    if (error) {
                        console.error('Failed to insert into database:', error);
                        return res.status(500).json({ message: 'Error registering bicycle', error: error.message });
                    }
                    console.log('Inserted record with ID:', results.insertId);
                    res.json({ message: 'Registration Successful!', registrationCode });
                });
            });

        });
    });
});

app.get('/api/registration_info', function(req, res) {
    const code = req.query.code;
    db.query('SELECT ownerName, address, registrationCode FROM Bicycles WHERE registrationCode = ?', [code], function(error, results) {
        if (error) return res.status(500).json({ error: 'Database query error' });
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: 'Registration not found' });
        }
    });
});

app.get('/registration_card', function(req, res) {
    const filePath = path.join('/var/www/html/pedarling_test', 'registration_card.html');
    res.sendFile(filePath);});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// // Route for serving the registration card page
// app.get('/registration_card', function(req, res) {
//     res.sendFile('/var/www/html/pedarling_test/registration_card.html');
// });

// // /registration_card 라우트 추가
