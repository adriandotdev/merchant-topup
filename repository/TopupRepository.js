const mysql = require("../database/mysql");

const Crypto = require("../utils/Crypto");

module.exports = class TopupRepository {
	VerifyTopupByRFID(identifier) {
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
};
