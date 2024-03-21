const mysql = require("../database/mysql");

const Crypto = require("../utils/Crypto");

module.exports = class TopupRepository {
	VerifyTopupByIdentifier(identifier) {
		const QUERY = `
        SELECT 
            users.id,
            name,
            address,
            email AS email_address,
            mobile_number,
            rfid_card_tag AS rfid,
            plate_number AS vehicle_plate_number,
            model AS vehicle_model,
            brand AS vehicle_brand,
            username
        FROM users
        INNER JOIN user_drivers
        ON users.id = user_drivers.user_id
        INNER JOIN user_driver_vehicles
        ON user_drivers.id = user_driver_vehicles.user_driver_id
        WHERE rfid_card_tag = ? OR mobile_number = ?`;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[identifier, Crypto.Encrypt(identifier)],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	Topup(identifier, amount, paymentType) {
		const QUERY = `CALL WEB_USER_MERCHANT_TOPUP(?,?,?,?)`;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[identifier, Crypto.Encrypt(identifier), amount, paymentType],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}

	GetTopupsByUserID(userID, currentDateTime) {
		const QUERY = `
		SELECT *, DATE_ADD(date_created, INTERVAL 60 MINUTE) AS voidable_until
		FROM topup_logs
		WHERE user_id = ?
		AND NOW() < DATE_ADD(date_created, INTERVAL 60 MINUTE) 
		AND type = 'TOPUP'
		AND void_id IS NULL`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [userID, currentDateTime], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	VoidTopupByReferenceNumber(referenceNumber) {
		const QUERY = `CALL WEB_USER_MERCHANT_VOID_TOPUP(?)`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [referenceNumber], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}
};
