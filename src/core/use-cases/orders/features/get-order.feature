Feature: Get Order By Id

  Scenario: Successfully retrieve an existing order by ID
    Given an existing order with id 123
    When the getById method is called with { "orderId": 123 }
    Then the order details are returned

  Scenario: Attempt to retrieve a non-existent order by ID
    Given a non-existent order with id 456
    When the getById method is called with { "orderId": 456 }
    Then a NotFoundException with message "Order not found!" is thrown