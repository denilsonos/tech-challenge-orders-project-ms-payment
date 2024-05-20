Feature: Get Payment

Scenario: Retrieve an existing payment by ID
  Given an existing payment with id 123
  When the getById method is called with { "paymentId": 123 }
  Then the payment details are returned
