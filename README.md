# Merchant Topup

## APIs

### GET `/merchant_topup/api/v1/topup/verify/:identifier`

This API will verify the rfid user based on RFID tag number, or contact number.

Parameters

- identifier - it could be an RFID tag or a contact number.

Response

```json
{
	"status": 200,
	"data": {
		"id": 59,
		"name": "CJ Perez",
		"address": "Pasay City",
		"email_address": "emailtester492@gmail.com",
		"mobile_number": "09341123341",
		"rfid": "888800023025",
		"vehicle_plate_number": "ABCFGAB",
		"vehicle_model": "Tesla 1",
		"vehicle_brand": "Tesla",
		"username": "cjperez"
	},
	"message": "Success"
}
```

### POST `/merchant_topup/api/v1/topup/:identifier`

Topup by RFID card tag or contact number.

Parameter

- identifier - It could be RFID card tag or contact number.

Request Body

```json
{
	"amount": 500,
	"payment_type": "CARD"
}
```

- amount - Amount to be added to an account
- payment_type - It could be GCash, Maya, or Card

Response

```json
{
	"status": 200,
	"data": {
		"STATUS": "SUCCESS",
		"new_balance": "4208.00"
	},
	"message": "Success"
}
```

### GET `/merchant_topup/api/v1/topup/:user_id`

Retrieve all of the topups of the user. This will only return topups below 60 mins from the time of topup.

Parameter

- user_id - ID of the user

Response

```json
{
	"status": 200,
	"data": [
		{
			"id": 2, // Transaction ID
			"user_id": 59, // ID of the user
			"user_type": "USER_DRIVER", // Role of the user
			"amount": "500.00",
			"type": "TOPUP",
			"cpo_owner_id": 1,
			"payment_type": "CARD", // Payment type
			"payment_status": "success",
			"transaction_id": null,
			"client_key": null,
			"topup_income": null,
			"topup_income_setting": null,
			"description": null,
			"void_id": null,
			"date_created": "2024-03-25T00:19:46.000Z",
			"date_modified": "2024-03-25T00:19:46.000Z",
			"voidable_until": "2024-03-25T01:19:46.000Z"
		},
		{
			"id": 3,
			"user_id": 59,
			"user_type": "USER_DRIVER",
			"amount": "500.00",
			"type": "TOPUP",
			"cpo_owner_id": 1,
			"payment_type": "CARD",
			"payment_status": "success",
			"transaction_id": null,
			"client_key": null,
			"topup_income": null,
			"topup_income_setting": null,
			"description": null,
			"void_id": null,
			"date_created": "2024-03-25T00:19:48.000Z",
			"date_modified": "2024-03-25T00:19:48.000Z",
			"voidable_until": "2024-03-25T01:19:48.000Z"
		}
	],
	"message": "Success"
}
```

### POST `/merchant_topup/api/v1/topup/void/:reference_number`

Void a specific topup

Parameter

- reference_number - topup's reference number.

Response

```json
{
	"status": 200,
	"data": {
		"STATUS": "SUCCESS",
		"current_balance": "3708.00",
		"reference_number": 4
	},
	"message": "Success"
}
```
