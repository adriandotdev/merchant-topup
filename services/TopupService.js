/**
 * @CreatedBy Adrian Nads L. Marcelo
 * @CreatedAt 2024-03-20
 * @LastModified 2024-03-21
 */
const TopupRepository = require("../repository/TopupRepository");
const Crypto = require("../utils/Crypto");
const { HttpBadRequest } = require("../utils/HttpError");

const logger = require("../config/winston");

module.exports = class TopupService {
	#repository;

	constructor() {
		this.#repository = new TopupRepository();
	}

	/**
	 * Verifies a top-up by identifier.
	 *
	 * This function verifies a top-up using the provided identifier. It retrieves the user associated with the top-up, decrypts sensitive user information,
	 * and returns the decrypted user data.
	 *
	 * @function VerifyTopupByIdentifier
	 * @param {string} identifier - The identifier associated with the top-up.
	 * @returns {Promise<Object>} A promise that resolves to the decrypted user data associated with the top-up.
	 * @throws {HttpBadRequest} If the account associated with the identifier is not found.
	 */
	async VerifyTopupByIdentifier(identifier) {
		const result = await this.#repository.VerifyTopupByIdentifier(identifier);

		if (!result[0]) throw new HttpBadRequest("ACCOUNT_NOT_FOUND", []);

		const user = Object.entries(result[0]);

		let decryptedUser = {};

		for (const [key, value] of user) {
			if (!["id", "username", "rfid"].includes(key))
				decryptedUser[key] = Crypto.Decrypt(value);
			else decryptedUser[key] = value;
		}
		return decryptedUser;
	}

	/**
	 * Initiates a top-up transaction.
	 *
	 * This function initiates a top-up transaction with the provided identifier, amount, and payment type.
	 * It interacts with the repository to perform the top-up operation and returns the status of the transaction
	 * along with the new balance if the transaction is successful.
	 *
	 * @function Topup
	 * @param {string} identifier - The identifier associated with the user account.
	 * @param {number} amount - The amount to be topped up.
	 * @param {string} paymentType - The type of payment for the top-up (e.g., "CARD", "MAYA").
	 * @returns {Promise<Object|string>} A promise that resolves to an object containing the status of the top-up transaction and the new balance
	 * if the transaction is successful. If the transaction fails, it returns the status message.
	 */
	async Topup(identifier, amount, paymentType) {
		const result = await this.#repository.Topup(
			identifier,
			amount,
			paymentType
		);

		const STATUS = result[0][0].STATUS;
		const new_balance = result[0][0].new_balance;

		logger.info(STATUS);

		if (STATUS !== "SUCCESS") return STATUS;

		return { STATUS, new_balance };
	}

	/**
	 * Retrieves top-up transactions by user ID and current date and time.
	 *
	 * This function retrieves top-up transactions associated with the specified user ID
	 * up to the provided current date and time. It interacts with the repository to
	 * fetch the relevant top-up data.
	 *
	 * @function GetTopupsByUserID
	 * @param {string} userID - The ID of the user whose top-up transactions are to be retrieved.
	 * @param {Date} currentDateTime - The current date and time used as a reference for filtering top-up transactions.
	 * @returns {Promise<Array>} A promise that resolves to an array containing the top-up transactions matching the specified user ID and current date and time.
	 */
	async GetTopupsByUserID(userID, currentDateTime) {
		const result = await this.#repository.GetTopupsByUserID(
			userID,
			currentDateTime
		);

		return result;
	}

	/**
	 * Voids a top-up transaction by reference number.
	 *
	 * This function voids the top-up transaction associated with the specified reference number.
	 * It interacts with the repository to perform the void operation and retrieves the status,
	 * reference number, and current balance after voiding.
	 *
	 * @function VoidTopupByReferenceNumber
	 * @param {string} referenceNumber - The reference number of the top-up transaction to be voided.
	 * @returns {Promise<Object|string>} A promise that resolves to an object containing the voided top-up transaction details (including status, reference number, and current balance) if successful, or a string representing the error status if unsuccessful.
	 */
	async VoidTopupByReferenceNumber(referenceNumber) {
		const result = await this.#repository.VoidTopupByReferenceNumber(
			referenceNumber
		);

		const STATUS = result[0][0].STATUS;
		const reference_number = result[0][0].reference_number;
		const current_balance = result[0][0].current_balance;

		if (STATUS !== "SUCCESS") return STATUS;

		return { STATUS, current_balance, reference_number };
	}
};
