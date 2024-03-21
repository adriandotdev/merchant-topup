/**
 * @CreatedBy Adrian Nads L. Marcelo
 * @CreatedAt 2024-03-20
 * @LastModified 2024-03-20
 */
const { validationResult, param, body } = require("express-validator");

const TopupService = require("../services/TopupService");
const { AccessTokenVerifier } = require("../middlewares/TokenMiddleware");

// Utilities
const logger = require("../config/winston");
const { HttpUnprocessableEntity } = require("../utils/HttpError");

/**
 * @param {import('express').Express} app
 */
module.exports = (app) => {
	const service = new TopupService();

	/**
	 * This function will be used by the express-validator for input validation,
	 * and to be attached to APIs middleware.
	 * @param {*} req
	 * @param {*} res
	 */
	function validate(req, res) {
		const ERRORS = validationResult(req);

		if (!ERRORS.isEmpty()) {
			throw new HttpUnprocessableEntity(
				"Unprocessable Entity",
				ERRORS.mapped()
			);
		}
	}

	app.get(
		"/merchant_topup/api/v1/topup/verify/:identifier",
		[
			AccessTokenVerifier,
			param("identifier")
				.notEmpty()
				.withMessage("Missing required parameter: identifier"),
		],
		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res) => {
			logger.info({
				TOPUP_VERIFY_RFID_REQUEST: { identifier: req.params.identifier },
			});

			try {
				if (req.role !== "CPO_OWNER") throw new HttpForbidden("Forbidden", []);

				const { identifier } = req.params;

				const result = await service.VerifyTopupByIdentifier(identifier);

				logger.info({ TOPUP_VERIFY_RFID_RESPONSE: { identifier } });

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				logger.error({
					TOPUP_VERIFY_RFID_ERROR: {
						message: err,
					},
				});

				return res.status(err.status || 500).json({
					status: err.status || 500,
					data: err.data || [],
					message: err.message || "Internal Server Error",
				});
			}
		}
	);

	app.post(
		"/merchant_topup/api/v1/topup/:identifier",
		[
			AccessTokenVerifier,
			body("amount")
				.notEmpty()
				.withMessage("Missing required property: amount")
				.isInt({ min: 27 })
				.withMessage(
					"Amount must be a whole number, and the minimum amount for topup is twenty-seven (27) pesos"
				)
				.escape()
				.trim(),
			body("payment_type")
				.notEmpty()
				.withMessage("Missing required property: payment_type")
				.custom((value) => ["CARD", "MAYA", "GCASH"].includes(value))
				.withMessage("Valid payment types are: CARD, MAYA, GCASH")
				.escape()
				.trim(),
		],

		/**
		 * @param {import('express').Request} req
		 * @param {import('express').Response} res
		 */
		async (req, res) => {
			logger.info({
				TOPUP_REQUEST: {
					identifier: req.params.identifier,
					body: req.body.amount,
				},
			});

			try {
				validate(req, res);

				if (req.role !== "CPO_OWNER") throw new HttpForbidden("Forbidden", []);

				const { identifier } = req.params;
				const { amount, payment_type } = req.body;

				const result = await service.Topup(identifier, amount, payment_type);

				logger.info({ TOPUP_RESPONSE: { identifier, amount, payment_type } });

				return res
					.status(200)
					.json({ status: 200, data: result, message: "Success" });
			} catch (err) {
				logger.error({
					TOPUP_ERROR: {
						message: err,
					},
				});

				return res.status(err.status || 500).json({
					status: err.status || 500,
					data: err.data || [],
					message: err.message || "Internal Server Error",
				});
			}
		}
	);
};
