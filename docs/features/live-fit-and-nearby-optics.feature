Feature: Live 3D head fit and nearby optic match
  As a person looking for glasses
  I want to photograph my face, measure my head in 3D, and see frames that fit those measurements
  So that I can try a matching pair at a real nearby optical shop

  Scenario: Happy path — live capture yields fitted frames and nearby optics
    Given the catalog contains frames with measured geometry (lens width, bridge, temple, shape)
    And my device camera and location are available
    When I capture a live frontal photo with a detectable face
    Then the service returns 3D head parameters including interpupillary distance and face width
    And the service returns only catalog frames scored against those parameters
    And each frame score includes a physiognomy breakdown: face shape is paired by contrast, not by copying the same outline
    And each catalog frame is bound to a shape-specific 3D silhouette (rect, oval, round, or cat), not one shared sunglasses model
    And the try-on overlay uses that 3D silhouette rather than an SVG drawing
    And after a successful fit I see a visit packet with estimated IPD, face width, and a typical eye-bridge-temple size marked as not a prescription
    And I can share that packet or open WhatsApp to a listed shop
    And the service returns nearby optical shops from the ODOS 2GIS catalog ranked by distance
    And if location is denied I pick a city myself instead of silently substituting another city
    And the response contains no placeholder portraits, fake shops, or invented stock photos

  Scenario: Edge — capture is blocked until a frontal face is in frame
    Given the live camera is on
    And no usable frontal face is detected
    When I try to take measurements
    Then the capture action stays unavailable
    And the studio asks me to face the camera with light from the front

  Scenario: Edge — no face in the capture
    Given I submit a photo that contains no detectable face
    When the fit request is processed
    Then the request is rejected with a validation error
    And no frame matches and no shops are returned

  Scenario: Edge — oversized or invalid image
    Given I submit a payload that is not a JPEG or PNG, or exceeds the maximum image size
    When the fit request is processed
    Then the request is rejected with a client error
    And no frame matches are returned

  Scenario: Edge — location missing when requesting nearby optics
    Given a valid face capture has produced head parameters
    When I request nearby optics without coordinates
    Then the shop lookup is rejected with a validation error
    And previously computed frame matches remain available without fabricated shop rows
