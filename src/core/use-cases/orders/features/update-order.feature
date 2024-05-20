Feature: Manage Orders
    
  Scenario: Successfully update the status of an existing order
    Given an existing order with id 123
    When the update method is called with { "orderId": 123, "status": "Created" }
    Then the order status is updated to "Created"