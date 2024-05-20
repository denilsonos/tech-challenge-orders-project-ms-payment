Feature: Create Payment

Scenario: Successfully create a payment for an order
  Given an existing order with id 456 and status "Created"
  When the createOrderPayment method is called with { "orderId": 456 }
  Then a new payment is created and the order status is updated to "PendingPayment"
