Feature: Create Payment

  Scenario: Successfully create payment for a valid order
    Given an existing order with id 123
    When the create method is called with { "orderId": 123 }
    Then a payment for order 123 is successfully created

  Scenario: Attempt to create payment for an invalid order
    Given an order with id 456 does not exist
    When the create method is called with { "orderId": 456 }
    Then a BadRequestException with message "Order identifier 456 is invalid!" is thrown

  Scenario: Attempt to create payment for an order with status other than Created
    Given an existing order with id 789 with status Shipped
    When the create method is called with { "orderId": 789 }
    Then a BadRequestException with message "Order already has a pending payment!" is thrown

  Scenario: Attempt to create payment with invalid payload
    Given an invalid payload { "orderId": "invalid" }
    When the create method is called
    Then a BadRequestException with message "Validation error!" is thrown