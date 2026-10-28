import assert from "node:assert/strict";
import test from "node:test";
import {
  compareSavedPropertiesPath,
  commuteRequestPath,
} from "../lib/api/comparison-request-paths.ts";
import { encodeBackendPathSegments } from "../lib/api/backend-path.ts";
import { backendFailure } from "../lib/api/backend-error-catalog.ts";
import { neighborhoodRequestPaths } from "../lib/api/neighborhood-request-paths.ts";

test("commute request uses Spring's latitude and longitude query names", () => {
  assert.equal(
    commuteRequestPath(24.896053, 46.61581),
    "/api/v1/place-preference/me/commutes?latitude=24.896053&longitude=46.61581",
  );
});

test("neighborhood search paths match Spring query parameter names", () => {
  assert.equal(
    neighborhoodRequestPaths.category("supermarket", 2000),
    "/api/v1/current-home/me/nearby-by-category?category=supermarket&radius=2000",
  );
  assert.equal(
    neighborhoodRequestPaths.search("coffee shop", 3000),
    "/api/v1/current-home/me/nearby-search?query=coffee+shop&radius=3000",
  );
  assert.equal(
    neighborhoodRequestPaths.essentials(1500),
    "/api/v1/current-home/me/nearest-essential?radius=1500",
  );
});

test("comparison request uses saved-property IDs and preserves Spring list encoding", () => {
  const frontendPath = compareSavedPropertiesPath([5, 4]);
  assert.equal(frontendPath, "/api/v1/property-comparison/me/compare-multiple/5,4");
  assert.equal(
    encodeBackendPathSegments(frontendPath.split("/").slice(1)),
    "/api/v1/property-comparison/me/compare-multiple/5%2C4",
  );
});

test("BFF error policy preserves upstream status and only forwards reviewed messages", () => {
  for (const status of [400, 401, 403, 404, 500, 502]) {
    assert.deepEqual(backendFailure(status, "upstream detail"), {
      status,
      backendMessage: undefined,
    });
  }
  assert.deepEqual(backendFailure(400, "Housing preferences not found"), {
    status: 400,
    backendMessage: "Housing preferences not found",
  });
  assert.deepEqual(
    backendFailure(400, "Failed to search nearby places: private upstream detail"),
    {
      status: 400,
      backendMessage: "Google Places search failed",
    },
  );
  assert.deepEqual(
    backendFailure(400, "Failed to calculate route: private upstream detail"),
    {
      status: 400,
      backendMessage: "Google Routes request failed",
    },
  );
});
