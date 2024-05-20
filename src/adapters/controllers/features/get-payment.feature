Feature: Get Payment

  Scenario: Successfully retrieve payment details
    Given an existing payment with id 123
    When the getPayment method is called with { "id": 123 }
    Then the details of payment 123 are returned

  Scenario: Attempt to retrieve payment details with invalid parameters
    Given an invalid paymentId
    When the getPayment method is called with { "id": "invalid" }
    Then a BadRequestException with message "Validation error!" is thrown

  Scenario: Attempt to retrieve details for a non-existent payment
    Given a non-existent payment with id 456
    When the getPayment method is called with { "id": 456 }
    Then a BadRequestException with message "Payment not found!" is thrown
