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

	Topup(identifier, amount) {
		const QUERY = `UPDATE users AS u
        INNER JOIN user_drivers AS ud
        ON u.id = ud.user_id
        INNER JOIN rfid_cards AS rc
        ON ud.id = rc.user_driver_id
        SET balance = balance + ?
        WHERE rc.rfid_card_tag = ? OR ud.mobile_number = ?`;

		return new Promise((resolve, reject) => {
			mysql.query(
				QUERY,
				[amount, identifier, Crypto.Encrypt(identifier)],
				(err, result) => {
					if (err) {
						reject(err);
					}

					resolve(result);
				}
			);
		});
	}
};
