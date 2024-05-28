/**
 * @CreatedBy Adrian Nads L. Marcelo
 * @CreatedAt 2024-03-20
 * @LastModified 2024-03-21
 */
const mysql = require("../database/mysql");

const Crypto = require("../utils/Crypto");

module.exports = class TopupRepository {
	/**
	 * Verifies a top-up by identifier.
	 *
	 * This function retrieves user information based on the provided identifier (RFID tag or mobile number).
	 * It searches for a user with the specified RFID tag or mobile number in the database and returns their details,
	 * including user ID, name, address, email, mobile number, RFID tag, vehicle plate number, vehicle model, vehicle brand, and username.
	 *
	 * @function VerifyTopupByIdentifier
	 * @param {string} identifier - The identifier (RFID tag or mobile number) associated with the user.
	 * @returns {Promise<Object[]>} A promise that resolves to an array of user details if the identifier is found, or an empty array if not found.
	 */
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
        FROM 
			users
        INNER JOIN user_drivers ON users.id = user_drivers.user_id
        INNER JOIN user_driver_vehicles ON user_drivers.id = user_driver_vehicles.user_driver_id
        WHERE 
			rfid_card_tag = ? 
			OR mobile_number = ?`;

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

	/**
	 * Initiates a top-up for a user account.
	 *
	 * This function triggers a top-up operation for the specified user account identified by RFID tag or mobile number.
	 * It calls the stored procedure 'WEB_USER_MERCHANT_TOPUP' in the database to execute the top-up process.
	 * The top-up amount and payment type are provided as parameters.
	 *
	 * @function Topup
	 * @param {string} identifier - The identifier (RFID tag or mobile number) associated with the user account.
	 * @param {number} amount - The amount to be topped up into the user account.
	 * @param {string} paymentType - The payment type used for the top-up (e.g., 'CARD', 'MAYA', etc.).
	 * @returns {Promise<Object[]>} A promise that resolves to an array containing the result of the top-up operation.
	 */
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

	/**
	 * Retrieves top-up records for a specific user ID.
	 *
	 * This function fetches top-up records from the database for the specified user ID within a certain time frame.
	 * It selects records from the 'topup_logs' table where the user ID matches the provided userID parameter,
	 * the current time is within 60 minutes from the top-up creation time, the type of transaction is 'TOPUP',
	 * and the transaction has not been voided.
	 *
	 * @function GetTopupsByUserID
	 * @param {number} userID - The ID of the user for whom top-up records are to be retrieved.
	 * @param {Date} currentDateTime - The current date and time used for comparison to determine voidable transactions.
	 * @returns {Promise<Object[]>} A promise that resolves to an array containing the top-up records for the specified user.
	 */
	GetTopupsByUserID(userID, currentDateTime) {
		const QUERY = `
			SELECT 
				*, 
				DATE_ADD(date_created, INTERVAL 60 MINUTE) AS voidable_until
			FROM 
				topup_logs
			WHERE 
				user_id = ?
				AND NOW() < DATE_ADD(date_created, INTERVAL 60 MINUTE) 
				AND type = 'TOPUP'
				AND void_id IS NULL
		`;

		return new Promise((resolve, reject) => {
			mysql.query(QUERY, [userID, currentDateTime], (err, result) => {
				if (err) {
					reject(err);
				}

				resolve(result);
			});
		});
	}

	/**
	 * Voids a top-up transaction based on the provided reference number.
	 *
	 * This function voids a top-up transaction by calling a stored procedure in the database
	 * with the given reference number as a parameter.
	 *
	 * @function VoidTopupByReferenceNumber
	 * @param {string} referenceNumber - The reference number of the top-up transaction to be voided.
	 * @returns {Promise<Object[]>} A promise that resolves to the result of the voiding operation.
	 */
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
