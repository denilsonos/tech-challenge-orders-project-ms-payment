Feature: Recuse Payment

  Scenario: Successfully recuse payment for an order
    Given an existing payment with id 123 and an existing order with id 456
    When the recuse method is called with { "paymentId": 123, "orderId": 456 }
    Then the payment for order 456 is recused and the order status is set to Recused

  Scenario: Attempt to recuse payment with invalid payment payload
    Given an invalid payload { "paymentId": "invalid", "orderId": 987 }
    When the recuse method is called
    Then a BadRequestException with message "Validation error!" is thrown

  Scenario: Attempt to recuse payment for a non-existent payment
    Given a non-existent payment with id 789 and an existing order with id 456
    When the recuse method is called with { "paymentId": 789, "orderId": 456 }
    Then a BadRequestException with message "Payment identifier 789 is invalid!" is thrown

  Scenario: Attempt to recuse payment for a payment that has already been made
    Given a payment with id 123 that has already been confirmed and an existing order with id 456
    When the recuse method is called with { "paymentId": 123, "orderId": 456 }
    Then a BadRequestException with message "Payment has already been made!" is thrown

  Scenario: Attempt to recuse payment for a non-existent order
    Given an existing payment with id 123 and a non-existent order with id 987
    When the recuse method is called with { "paymentId": 123, "orderId": 987 }
    Then a BadRequestException with message "Order identifier 987 is invalid!" is thrown

  Scenario: Attempt to recuse payment for an order that does not have a pending payment
    Given an existing payment with id 123 and an order with id 456 that does not have a pending payment
    When the recuse method is called with { "paymentId": 123, "orderId": 456 }
    Then a BadRequestException with message "Order does not have a pending payment!" is thrown

