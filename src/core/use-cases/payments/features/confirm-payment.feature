Feature: Confirm Payment

Scenario: Successfully confirm a payment for an order
  Given an existing payment with id 123 and an existing order with id 456
  When the confirmOrderPayment method is called with { "paymentId": 123, "orderId": 456 }
  Then the payment status is updated to "Confirmed"
