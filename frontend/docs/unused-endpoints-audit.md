# تدقيق نقاط Backend غير المستخدمة في Frontend

تاريخ الفحص: 2026-10-28. تم استخراج المسارات مباشرة من Spring Controllers الحالية. لم تُشغّل خدمة أو تُرسل طلبات HTTP، ولم تُستهلك حصص خارجية. تم تتبع ملفات API clients إلى React Query hooks ثم Components/Pages، وكذلك handlers في Next.js BFF ومسار Auth المخصص.

| التصنيف | العدد |
|---|---:|
| إجمالي Backend Endpoints | 123 |
| مستخدمة فعليًا | 78 |
| مربوطة جزئيًا | 24 |
| غير مستخدمة | 17 |
| Backend Only | 4 |
| غير مؤكدة | 0 |

## منهج التصنيف

- **USED**: يوجد استدعاء من Component/Page/Hook فعلي أو مسار server-side مستخدم. وجود مسار في BFF أو API client وحده لا يكفي.
- **PARTIALLY INTEGRATED**: يوجد API client/BFF أو مسار تنفيذ جزئي، لكن لا يوجد استدعاء واجهة فعلي. يتضمن ذلك endpoints الإدارة التي لها API client دون UI caller، ومسارات BFF legacy دون API client.
- **UNUSED**: لا يوجد caller أو API client أو BFF operation في الفرونت إند الحالي.
- **BACKEND ONLY**: Webhook أو تكامل داخلي؛ استدعاؤه من المتصفح غير مطلوب.
- **UNCERTAIN**: لم تظهر حالة تستدعي هذا التصنيف بعد تتبع dynamic URLs المعروفة. عومل `payments.verify` كمستخدم لأن Next BFF يحول POST browser إلى GET backend عمدًا.

التغطية الفعلية = USED / إجمالي Backend Endpoints = **63.4%** (78 من 123).

## قائمة Controllers الكاملة

تشمل القائمة الـ123 mapping الفعلية، بما فيها `@GetMapping` و`@PostMapping` ذات المسار الفارغ التي تستخدم class-level path كما هي. الوظيفة ملخص لاسم service method المسؤول. كل مرجع يذكر ملف controller وسطر mapping، ثم دليل الفرونت إن وجد.

| Method | Endpoint | Controller | Service المسؤول | الوظيفة | التصنيف | دليل الاستخدام/سبب الغياب |
|---|---|---|---|---|---|---|
| GET | `/api/v1/user/admin/users` | `AdminController.java:33` | `adminService.getAllUsers` | get All Users. | **USED** | features/account/admin-users.tsx; lib/api/admin.ts |
| DELETE | `/api/v1/user/admin/users/{targetUserId}` | `AdminController.java:48` | `adminService.adminDeleteUser` | admin Delete User. | **PARTIALLY INTEGRATED** | lib/api/admin.ts only; mutation has no UI call site |
| PUT | `/api/v1/user/admin/users/{targetUserId}/suspend` | `AdminController.java:60` | `adminService.adminSuspendUser` | admin Suspend User. | **PARTIALLY INTEGRATED** | lib/api/admin.ts only; mutation has no UI call site |
| PUT | `/api/v1/user/admin/users/{targetUserId}/unsuspend` | `AdminController.java:72` | `adminService.adminUnsuspendUser` | admin Unsuspend User. | **PARTIALLY INTEGRATED** | lib/api/admin.ts only; mutation has no UI call site |
| GET | `/api/v1/user/admin/dashboard` | `AdminController.java:86` | `adminService.getDashboardStatistics` | get Dashboard Statistics. | **UNUSED** | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/users/search` | `AdminController.java:98` | `adminService.searchUsers` | search Users. | **UNUSED** | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/users/{userId}` | `AdminController.java:112` | `adminService.getUserById` | get User By Id. | **UNUSED** | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/dashboard/recent-users` | `AdminController.java:122` | `adminService.getRecentUsers` | get Recent Users. | **UNUSED** | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/payments` | `AdminController.java:134` | `adminService.getAllPayments` | get All Payments. | **UNUSED** | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/payments/{paymentId}` | `AdminController.java:148` | `adminService.getPaymentById` | get Payment By Id. | **UNUSED** | No frontend client/BFF operation or UI call site found |
| POST | `/api/v1/user/admin/users/{targetUserId}/gift-credits` | `AdminController.java:161` | `adminService.giftCreditsToUser` | gift Credits To User. | **UNUSED** | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/audit-logs` | `AdminController.java:176` | `adminService.getAuditLogs` | get Audit Logs. | **UNUSED** | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/system-health` | `AdminController.java:189` | `systemHealthService.getSystemHealth` | get System Health. | **UNUSED** | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/ai/explain-match` | `AiController.java:21` | `aiService.explainMatch` | explain Match. | **USED** | features/workspace/ai-assistant.tsx; lib/api/insights.ts |
| POST | `/api/v1/ai/chat` | `AiController.java:29` | `aiService.chatWithCredits` | chat With Credits. | **USED** | features/assistant/hooks/use-assistant-conversation.ts:5; lib/api/chat.ts |
| DELETE | `/api/v1/ai/chat` | `AiController.java:36` | `aiService.clearChat` | clear Chat. | **USED** | features/assistant/hooks/use-assistant-conversation.ts:5; lib/api/chat.ts |
| POST | `/api/v1/auth/register` | `AuthController.java:26` | `authService.register` | register. | **USED** | features/auth/auth-form.tsx:7; lib/auth/client.ts; app/api/auth/[operation]/route.ts |
| POST | `/api/v1/auth/login` | `AuthController.java:31` | `authService.login` | login. | **USED** | features/auth/auth-form.tsx:7; lib/auth/client.ts; app/api/auth/[operation]/route.ts |
| POST | `/api/v1/auth/forgot-password` | `AuthController.java:36` | `authService.forgotPassword` | forgot Password. | **USED** | features/auth/use-password-recovery.ts:8; lib/auth/client.ts; app/api/auth/[operation]/route.ts |
| POST | `/api/v1/auth/verify-reset-code` | `AuthController.java:42` | `authService.verifyResetCode` | verify Reset Code. | **USED** | features/auth/use-password-recovery.ts:8; lib/auth/client.ts; app/api/auth/[operation]/route.ts |
| POST | `/api/v1/auth/reset-password` | `AuthController.java:47` | `authService.resetPassword` | reset Password. | **USED** | features/auth/use-password-recovery.ts:8; lib/auth/client.ts; app/api/auth/[operation]/route.ts |
| PATCH | `/api/v1/auth/change-password` | `AuthController.java:53` | `authService.changePassword` | change Password. | **USED** | features/auth/change-password-form.tsx; app/api/auth/[operation]/route.ts |
| POST | `/api/v1/auth/refresh` | `AuthController.java:59` | `authService.refresh` | refresh. | **PARTIALLY INTEGRATED** | lib/auth/auth-api.server.ts and app/api/auth/[operation]/route.ts only; no UI call, handler falls through to 404 |
| POST | `/api/v1/auth/logout` | `AuthController.java:64` | `authService.logout` | logout. | **USED** | features/account/use-account-logout.ts:8; lib/auth/logout.server.ts; app/api/auth/[operation]/route.ts |
| POST | `/api/v1/auth/logout-all` | `AuthController.java:70` | `authService.logoutAll` | logout All. | **USED** | features/account/use-account-logout.ts:8; lib/auth/logout.server.ts; app/api/auth/[operation]/route.ts |
| GET | `/api/v1/credits/me/balance` | `CreditController.java:26` | `creditService.getBalance` | get Balance. | **USED** | features/payments/payment-page.tsx and/or features/neighborhood/neighborhood-commute.tsx; lib/api/credits.ts |
| GET | `/api/v1/credits/me/transactions` | `CreditController.java:36` | `creditService.getTransactionHistory` | get Transaction History. | **USED** | features/payments/payment-page.tsx and/or features/neighborhood/neighborhood-commute.tsx; lib/api/credits.ts |
| GET | `/api/v1/credits/prices` | `CreditController.java:46` | `creditService.getAllServicePrices` | get All Service Prices. | **USED** | features/payments/payment-page.tsx and/or features/neighborhood/neighborhood-commute.tsx; lib/api/credits.ts |
| GET | `/api/v1/credit-packages/active` | `CreditPackageController.java:23` | `creditPackageService.getActivePackages` | get Active Packages. | **USED** | features/payments/payment-page.tsx:401; lib/api/credits.ts |
| GET | `/api/v1/credit-packages` | `CreditPackageController.java:30` | `creditPackageService.getAllPackages` | get All Packages. | **UNUSED** | No frontend client/BFF operation or UI call site found (admin package management) |
| POST | `/api/v1/credit-packages` | `CreditPackageController.java:37` | `creditPackageService.addPackage` | add Package. | **UNUSED** | No frontend client/BFF operation or UI call site found (admin package management) |
| PUT | `/api/v1/credit-packages/{packageId}` | `CreditPackageController.java:47` | `creditPackageService.updatePackage` | update Package. | **UNUSED** | No frontend client/BFF operation or UI call site found (admin package management) |
| DELETE | `/api/v1/credit-packages/{packageId}` | `CreditPackageController.java:57` | `creditPackageService.deletePackage` | delete Package. | **UNUSED** | No frontend client/BFF operation or UI call site found (admin package management) |
| GET | `/api/v1/current-home/get` | `CurrentHomeController.java:30` | `currentHomeService.getAllCurrentHomes` | get All Current Homes. | **PARTIALLY INTEGRATED** | lib/api/admin.ts only; no component call site |
| GET | `/api/v1/current-home/me` | `CurrentHomeController.java:39` | `currentHomeService.getCurrentHomeByUserId` | get Current Home By User Id. | **USED** | features/account/current-home-panel.tsx:223; features/account/api/query-hooks.ts; lib/api/current-home.ts |
| POST | `/api/v1/current-home/me` | `CurrentHomeController.java:48` | `currentHomeService.addCurrentHome` | add Current Home. | **USED** | features/account/current-home-panel.tsx:223; features/account/api/query-hooks.ts; lib/api/current-home.ts |
| PUT | `/api/v1/current-home/me/{homeId}` | `CurrentHomeController.java:58` | `currentHomeService.updateCurrentHome` | update Current Home. | **USED** | features/account/current-home-panel.tsx:223; features/account/api/query-hooks.ts; lib/api/current-home.ts |
| DELETE | `/api/v1/current-home/me/{homeId}` | `CurrentHomeController.java:69` | `currentHomeService.deleteCurrentHome` | delete Current Home. | **USED** | features/account/current-home-panel.tsx:223; features/account/api/query-hooks.ts; lib/api/current-home.ts |
| POST | `/api/v1/current-home/me/confirm-move` | `CurrentHomeController.java:77` | `currentHomeService.confirmMove` | confirm Move. | **USED** | features/account/current-home-panel.tsx:223; lib/api/neighborhood.ts |
| GET | `/api/v1/current-home/me/neighborhood` | `CurrentHomeController.java:85` | `currentHomeService.getNeighborhood` | get Neighborhood. | **PARTIALLY INTEGRATED** | BFF allowlist only; no API client or UI consumer found |
| GET | `/api/v1/current-home/me/nearby-by-category` | `CurrentHomeController.java:92` | `currentHomeService.getNearbyByCategory` | get Nearby By Category. | **USED** | features/neighborhood/neighborhood.tsx; lib/api/neighborhood.ts |
| GET | `/api/v1/current-home/me/nearest-essential` | `CurrentHomeController.java:100` | `currentHomeService.getNearestEssential` | get Nearest Essential. | **USED** | features/neighborhood/neighborhood.tsx; lib/api/neighborhood.ts |
| GET | `/api/v1/current-home/me/nearby-search` | `CurrentHomeController.java:108` | `currentHomeService.searchNearby` | search Nearby. | **USED** | features/neighborhood/neighborhood.tsx; lib/api/neighborhood.ts |
| GET | `/api/v1/current-home/me/status` | `CurrentHomeController.java:117` | `currentHomeService.getCurrentHomeStatus` | get Current Home Status. | **USED** | features/account/current-home-panel.tsx:223; features/account/api/query-hooks.ts; lib/api/current-home.ts |
| GET | `/api/v1/housing-preference/get` | `HousingPreferenceController.java:30` | `housingPreferenceService.getAllHousingPreferences` | get All Housing Preferences. | **PARTIALLY INTEGRATED** | lib/api/admin.ts only; no component call site |
| GET | `/api/v1/housing-preference/me` | `HousingPreferenceController.java:39` | `housingPreferenceService.getHousingPreferenceByUserId` | get Housing Preference By User Id. | **USED** | features/account/housing-preferences-panel.tsx; features/search/smart-search-workspace.tsx; lib/api/preferences.ts |
| POST | `/api/v1/housing-preference/me` | `HousingPreferenceController.java:48` | `housingPreferenceService.addHousingPreference` | add Housing Preference. | **USED** | features/account/housing-preferences-panel.tsx; features/search/smart-search-workspace.tsx; lib/api/preferences.ts |
| PUT | `/api/v1/housing-preference/me/{preferenceId}` | `HousingPreferenceController.java:57` | `housingPreferenceService.updateHousingPreference` | update Housing Preference. | **USED** | features/account/housing-preferences-panel.tsx; features/search/smart-search-workspace.tsx; lib/api/preferences.ts |
| DELETE | `/api/v1/housing-preference/me/{preferenceId}` | `HousingPreferenceController.java:68` | `housingPreferenceService.deleteHousingPreference` | delete Housing Preference. | **USED** | features/account/housing-preferences-panel.tsx; features/search/smart-search-workspace.tsx; lib/api/preferences.ts |
| GET | `/api/v1/lifestyle-interest/me` | `LifestyleInterestController.java:27` | `lifestyleInterestService.getUserLifestyleInterests` | get User Lifestyle Interests. | **USED** | features/account/interests.tsx or features/search/smart-search-workspace.tsx; lib/api/lifestyle-interests.ts |
| POST | `/api/v1/lifestyle-interest/me` | `LifestyleInterestController.java:36` | `lifestyleInterestService.addLifestyleInterest` | add Lifestyle Interest. | **USED** | features/account/interests.tsx or features/search/smart-search-workspace.tsx; lib/api/lifestyle-interests.ts |
| PUT | `/api/v1/lifestyle-interest/me/{interestId}` | `LifestyleInterestController.java:45` | `lifestyleInterestService.updateLifestyleInterest` | update Lifestyle Interest. | **USED** | features/account/interests.tsx or features/search/smart-search-workspace.tsx; lib/api/lifestyle-interests.ts |
| DELETE | `/api/v1/lifestyle-interest/me/{interestId}` | `LifestyleInterestController.java:57` | `lifestyleInterestService.deleteLifestyleInterest` | delete Lifestyle Interest. | **PARTIALLY INTEGRATED** | lib/api/lifestyle-interests.ts only; no UI call site for delete |
| GET | `/api/v1/locations/cities` | `LocationController.java:21` | `locationService.getCities` | get Cities. | **USED** | features/locations/location-prefetch.tsx:2; features/locations/location-hooks.ts; lib/locations/catalog.server.ts |
| GET | `/api/v1/locations/cities/{city}/neighborhoods` | `LocationController.java:26` | `locationService.getNeighborhoods` | get Neighborhoods. | **USED** | features/locations/location-prefetch.tsx:2; features/locations/location-hooks.ts; lib/locations/catalog.server.ts |
| POST | `/api/v1/moving-checklist/generate` | `MovingChecklistController.java:20` | `movingChecklistService.generateChecklist` | generate Checklist. | **UNUSED** | No frontend API client/BFF operation or UI consumer found |
| GET | `/api/v1/moving-checklist/get` | `MovingChecklistController.java:28` | `movingChecklistService.getChecklist` | get Checklist. | **UNUSED** | No frontend API client/BFF operation or UI consumer found |
| PUT | `/api/v1/moving-checklist/toggle/{taskId}` | `MovingChecklistController.java:35` | `movingChecklistService.toggleTask` | toggle Task. | **UNUSED** | No frontend API client/BFF operation or UI consumer found |
| DELETE | `/api/v1/moving-checklist/reset` | `MovingChecklistController.java:43` | `movingChecklistService.resetChecklist` | reset Checklist. | **UNUSED** | No frontend API client/BFF operation or UI consumer found |
| POST | `/api/v1/n8n/price-changes` | `N8nController.java:20` | `internalApiKeyService.validate, n8nService.checkSavedPrices` | validate; check Saved Prices. | **BACKEND ONLY** | Backend internal API key caller (n8n workflow); no browser caller |
| GET | `/api/v1/n8n/weekly-report/recipients` | `N8nController.java:28` | `internalApiKeyService.validate, n8nService.getWeeklyReportRecipients` | validate; get Weekly Report Recipients. | **BACKEND ONLY** | Backend internal API key caller (n8n workflow); no browser caller |
| POST | `/api/v1/n8n/weekly-report/recommendations/{userId}` | `N8nController.java:36` | `internalApiKeyService.validate, n8nService.getWeeklyRecommendations` | validate; get Weekly Recommendations. | **BACKEND ONLY** | Backend internal API key caller (n8n workflow); no browser caller |
| GET | `/api/v1/notification/me` | `NotificationController.java:26` | `notificationService.getMyNotifications` | get My Notifications. | **USED** | features/workspace/notifications-query.ts:15; features/workspace/notification-bell.tsx; features/workspace/notifications-page.tsx |
| GET | `/api/v1/notification/me/unread` | `NotificationController.java:35` | `notificationService.getUnreadNotifications` | get Unread Notifications. | **PARTIALLY INTEGRATED** | lib/api/notifications.ts only; unread list/delete method has no UI consumer |
| GET | `/api/v1/notification/me/unread-count` | `NotificationController.java:44` | `notificationService.countUnreadNotifications` | count Unread Notifications. | **USED** | features/workspace/notifications-query.ts:15; features/workspace/notification-bell.tsx; features/workspace/notifications-page.tsx |
| PUT | `/api/v1/notification/me/{notificationId}/read` | `NotificationController.java:53` | `notificationService.markAsRead` | mark As Read. | **USED** | features/workspace/notifications-query.ts:15; features/workspace/notification-bell.tsx; features/workspace/notifications-page.tsx |
| PUT | `/api/v1/notification/me/read-all` | `NotificationController.java:66` | `notificationService.markAllAsRead` | mark All As Read. | **USED** | features/workspace/notifications-query.ts:15; features/workspace/notification-bell.tsx; features/workspace/notifications-page.tsx |
| DELETE | `/api/v1/notification/me/{notificationId}` | `NotificationController.java:78` | `notificationService.deleteNotification` | delete Notification. | **PARTIALLY INTEGRATED** | lib/api/notifications.ts only; unread list/delete method has no UI consumer |
| POST | `/api/v1/payments/me/checkout` | `PaymentController.java:23` | `paymentService.checkout` | checkout. | **USED** | features/payments/commute-panel.tsx; features/payments/payment-page.tsx:401; lib/api/payments.ts |
| GET | `/api/v1/payments/me/{paymentId}/verify` | `PaymentController.java:32` | `paymentService.verify` | verify. | **USED** | features/payments/payment-page.tsx:401; lib/api/payments.ts |
| POST | `/api/v1/payments/webhook` | `PaymentController.java:40` | `paymentService.processWebhook` | process Webhook. | **BACKEND ONLY** | Moyasar provider callback; no browser caller (expected) |
| GET | `/api/v1/payments/me` | `PaymentController.java:46` | `paymentService.getHistory` | get History. | **USED** | features/payments/payment-page.tsx:401; lib/api/payments.ts |
| GET | `/api/v1/payments/me/access/{serviceType}` | `PaymentController.java:53` | `paymentService.getAccess` | get Access. | **USED** | features/payments/commute-panel.tsx; features/payments/payment-page.tsx:401; lib/api/payments.ts |
| GET | `/api/v1/place-preference/me` | `PlacePreferenceController.java:27` | `placePreferenceService.getMyPlaces` | get My Places. | **USED** | features/daily-life/locations.tsx; features/account/api/query-hooks.ts; lib/api/places.ts |
| POST | `/api/v1/place-preference/me` | `PlacePreferenceController.java:35` | `placePreferenceService.addPlace` | add Place. | **USED** | features/daily-life/locations.tsx; features/account/api/query-hooks.ts; lib/api/places.ts |
| PUT | `/api/v1/place-preference/me/{placeId}` | `PlacePreferenceController.java:44` | `placePreferenceService.updatePlace` | update Place. | **USED** | features/daily-life/locations.tsx; features/account/api/query-hooks.ts; lib/api/places.ts |
| DELETE | `/api/v1/place-preference/me/{placeId}` | `PlacePreferenceController.java:54` | `placePreferenceService.deletePlace` | delete Place. | **USED** | features/daily-life/locations.tsx; features/account/api/query-hooks.ts; lib/api/places.ts |
| PATCH | `/api/v1/place-preference/me/{placeId}/importance/{importance}` | `PlacePreferenceController.java:64` | `placePreferenceService.updateImportance` | update Importance. | **PARTIALLY INTEGRATED** | lib/api/places.ts only; no UI call site |
| GET | `/api/v1/place-preference/me/commutes` | `PlacePreferenceController.java:75` | `placePreferenceService.getCommuteAnalysisWithCredits` | get Commute Analysis With Credits. | **USED** | features/payments/commute-panel.tsx; features/neighborhood/neighborhood-commute.tsx; features/comparisons/comparison-location-analysis.tsx |
| GET | `/api/v1/place-preference/nearby-services` | `PlacePreferenceController.java:85` | `placePreferenceService.getNearbyServices` | get Nearby Services. | **USED** | features/properties/components/nearby-services.tsx; lib/api/discovery.ts |
| GET | `/api/v1/place-preference/me/summary` | `PlacePreferenceController.java:93` | `placePreferenceService.getPlacesSummary` | get Places Summary. | **USED** | features/daily-life/locations.tsx; features/account/api/query-hooks.ts; lib/api/places.ts |
| GET | `/api/v1/property-comparison/get` | `PropertyComparisonController.java:31` | `comparisonService.getAllComparisons` | get All Comparisons. | **PARTIALLY INTEGRATED** | lib/api/admin.ts only; no component call site |
| GET | `/api/v1/property-comparison/me` | `PropertyComparisonController.java:40` | `comparisonService.getComparisonsByUserId` | get Comparisons By User Id. | **USED** | features/comparisons/comparisons.tsx; features/account/api/query-hooks.ts; lib/api/comparisons.ts |
| GET | `/api/v1/property-comparison/me/{comparisonId}` | `PropertyComparisonController.java:49` | `comparisonService.getComparisonById` | get Comparison By Id. | **USED** | features/comparisons/comparisons.tsx; features/account/api/query-hooks.ts; lib/api/comparisons.ts |
| POST | `/api/v1/property-comparison/me` | `PropertyComparisonController.java:59` | `comparisonService.addComparison` | add Comparison. | **USED** | features/comparisons/comparisons.tsx; features/account/api/query-hooks.ts; lib/api/comparisons.ts |
| PUT | `/api/v1/property-comparison/me/{comparisonId}` | `PropertyComparisonController.java:68` | `comparisonService.updateComparison` | update Comparison. | **USED** | features/comparisons/comparisons.tsx; features/account/api/query-hooks.ts; lib/api/comparisons.ts |
| DELETE | `/api/v1/property-comparison/me/{comparisonId}` | `PropertyComparisonController.java:80` | `comparisonService.deleteComparison` | delete Comparison. | **USED** | features/comparisons/comparisons.tsx; features/account/api/query-hooks.ts; lib/api/comparisons.ts |
| GET | `/api/v1/property-comparison/me/compare-two/{firstSource}/{firstPropertyId}/{secondSource}/{secondPropertyId}` | `PropertyComparisonController.java:94` | `comparisonService.compareTwoPropertiesWithCredits` | compare Two Properties With Credits. | **PARTIALLY INTEGRATED** | lib/api/insights.ts only; no UI call site |
| GET | `/api/v1/property-comparison/me/compare-multiple/{savedPropertyIds}` | `PropertyComparisonController.java:106` | `comparisonService.compareMultiplePropertiesWithCredits` | compare Multiple Properties With Credits. | **USED** | features/comparisons/computed-comparison.tsx; lib/api/insights.ts |
| GET | `/api/v1/properties/me/nearby-interests/{source}/{externalId}` | `PropertyController.java:24` | `nearbyInterestService.analyzeProperty` | analyze Property. | **USED** | features/properties/components/personal-property-insights.tsx; lib/api/insights.ts |
| GET | `/api/v1/properties/search` | `PropertyController.java:33` | `propertyService.searchPublic` | search Public. | **USED** | features/properties/search-page.tsx:55; lib/api/discovery.ts |
| GET | `/api/v1/properties/search/{city}/{listingType}/{propertyType}/{maxPrice}` | `PropertyController.java:40` | `propertyService.localize, propertyService.search` | localize; search. | **PARTIALLY INTEGRATED** | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/get/{source}/{externalId}` | `PropertyController.java:46` | `propertyService.localizeOne, propertyService.getPropertyById` | localize One; get Property By Id. | **USED** | features/properties/use-property.ts; features/comparisons/comparison-listings.tsx; lib/api/discovery.ts |
| GET | `/api/v1/properties/me/by-preference-in-my-district` | `PropertyController.java:52` | `propertyService.localize, propertyService.getByPreferenceInMyDistrict` | localize; get By Preference In My District. | **USED** | features/recommendations/recommendations.tsx; features/workspace/dashboard-recommendations.tsx; lib/api/discovery.ts |
| GET | `/api/v1/properties/near-location/{city}/{listingType}/{propertyType}/{latitude}/{longitude}/{radiusKm}` | `PropertyController.java:60` | `propertyService.localize, propertyService.getNearLocation` | localize; get Near Location. | **PARTIALLY INTEGRATED** | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/me/within-budget` | `PropertyController.java:66` | `propertyService.localize, propertyService.getWithinBudget` | localize; get Within Budget. | **USED** | features/recommendations/recommendations.tsx; features/workspace/dashboard-recommendations.tsx; lib/api/discovery.ts |
| GET | `/api/v1/properties/me/under-budget-margin/{margin}` | `PropertyController.java:74` | `propertyService.localize, propertyService.getUnderBudgetMargin` | localize; get Under Budget Margin. | **USED** | features/recommendations/recommendations.tsx; features/workspace/dashboard-recommendations.tsx; lib/api/discovery.ts |
| GET | `/api/v1/properties/by-districts/{city}/{listingType}/{propertyType}/{districts}` | `PropertyController.java:82` | `propertyService.localize, propertyService.getByDistricts` | localize; get By Districts. | **PARTIALLY INTEGRATED** | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/price-range/{city}/{listingType}/{propertyType}/{minPrice}/{maxPrice}` | `PropertyController.java:88` | `propertyService.localize, propertyService.getByPriceRange` | localize; get By Price Range. | **PARTIALLY INTEGRATED** | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/sort/{city}/{listingType}/{sortBy}` | `PropertyController.java:94` | `propertyService.localize, propertyService.sortProperties` | localize; sort Properties. | **PARTIALLY INTEGRATED** | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/price-stats/{city}/{listingType}/{propertyType}` | `PropertyController.java:100` | `propertyService.getPriceStats` | get Price Stats. | **USED** | features/recommendations/recommendations.tsx; lib/api/discovery.ts |
| GET | `/api/v1/properties/results-count/{city}/{listingType}` | `PropertyController.java:106` | `propertyService.getResultsCount` | get Results Count. | **PARTIALLY INTEGRATED** | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/similar/{source}/{externalId}` | `PropertyController.java:112` | `propertyService.localize, propertyService.getSimilar` | localize; get Similar. | **USED** | features/properties/detail-page.tsx; lib/api/discovery.ts |
| GET | `/api/v1/properties/me/match-summary` | `PropertyController.java:117` | `propertyService.getMatchSummary` | get Match Summary. | **USED** | features/recommendations/recommendations.tsx; lib/api/discovery.ts |
| GET | `/api/v1/properties/me/affordability` | `PropertyController.java:124` | `propertyService.analyzeAffordability` | analyze Affordability. | **USED** | features/properties/components/personal-property-insights.tsx; lib/api/insights.ts |
| POST | `/api/v1/recommendations/me/match-score` | `RecommendationController.java:28` | `recommendationService.calculatePropertyMatch` | calculate Property Match. | **USED** | features/properties/components/personal-property-insights.tsx; lib/api/insights.ts |
| POST | `/api/v1/recommendations/me/smart` | `RecommendationController.java:38` | `recommendationService.getSmartRecommendationsWithCredits` | get Smart Recommendations With Credits. | **USED** | features/recommendations/smart-recommendations.tsx; lib/api/insights.ts |
| GET | `/api/v1/recommendations/me/neighborhood-suitability` | `RecommendationController.java:47` | `recommendationService.getNeighborhoodSuitability` | get Neighborhood Suitability. | **USED** | features/neighborhood/neighborhood-analysis.tsx; lib/api/insights.ts |
| GET | `/api/v1/recommendations/me/compare-neighborhoods` | `RecommendationController.java:55` | `recommendationService.compareNeighborhoods` | compare Neighborhoods. | **USED** | features/neighborhood/neighborhood-analysis.tsx; lib/api/insights.ts |
| POST | `/api/v1/recommendations/me/suggest-neighborhoods` | `RecommendationController.java:66` | `recommendationService.suggestNeighborhoods` | suggest Neighborhoods. | **PARTIALLY INTEGRATED** | lib/api/insights.ts only; no UI call site for this method |
| PUT | `/api/v1/recommendations/me/selected-neighborhood` | `RecommendationController.java:75` | `recommendationService.selectNeighborhood` | select Neighborhood. | **PARTIALLY INTEGRATED** | lib/api/insights.ts only; no UI call site for this method |
| POST | `/api/v1/recommendations/me/selected-neighborhood-properties` | `RecommendationController.java:86` | `recommendationService.getSelectedNeighborhoodRecommendationsWithCredits` | get Selected Neighborhood Recommendations With Credits. | **PARTIALLY INTEGRATED** | lib/api/insights.ts only; no UI call site for this method |
| GET | `/api/v1/saved-property/me` | `SavedPropertyController.java:25` | `savedPropertyService.getMySavedProperty` | get My Saved Property. | **USED** | features/saved/saved.tsx; features/properties/property-card.tsx; features/account/api/query-hooks.ts; lib/api/saved-properties.ts |
| POST | `/api/v1/saved-property/me` | `SavedPropertyController.java:33` | `savedPropertyService.addSavedProperty` | add Saved Property. | **USED** | features/saved/saved.tsx; features/properties/property-card.tsx; features/account/api/query-hooks.ts; lib/api/saved-properties.ts |
| DELETE | `/api/v1/saved-property/me/{savedPropertyId}` | `SavedPropertyController.java:43` | `savedPropertyService.deleteSavedProperty` | delete Saved Property. | **USED** | features/saved/saved.tsx; features/properties/property-card.tsx; features/account/api/query-hooks.ts; lib/api/saved-properties.ts |
| GET | `/api/v1/saved-property/me/check` | `SavedPropertyController.java:52` | `savedPropertyService.isPropertySaved` | is Property Saved. | **USED** | features/saved/saved.tsx; features/properties/property-card.tsx; features/account/api/query-hooks.ts; lib/api/saved-properties.ts |
| GET | `/api/v1/saved-property/me/summary` | `SavedPropertyController.java:60` | `savedPropertyService.getSavedPropertiesSummary` | get Saved Properties Summary. | **USED** | features/saved/saved.tsx; features/properties/property-card.tsx; features/account/api/query-hooks.ts; lib/api/saved-properties.ts |
| GET | `/api/v1/user/me` | `UserController.java:28` | `userService.getMyAccount` | get My Account. | **USED** | features/account/profile.tsx; features/account/api/query-hooks.ts; auth session BFF |
| DELETE | `/api/v1/user/me` | `UserController.java:37` | `userService.deleteMyAccount` | delete My Account. | **USED** | features/account/profile.tsx; features/account/api/query-hooks.ts; auth session BFF |
| PUT | `/api/v1/user/me/deactivate` | `UserController.java:46` | `userService.deactivateMyAccount` | deactivate My Account. | **PARTIALLY INTEGRATED** | lib/api/account.ts only; no component call site |
| GET | `/api/v1/user/me/profile-completion` | `UserController.java:55` | `userService.getProfileCompletion` | get Profile Completion. | **USED** | features/account/api/query-hooks.ts; dashboard/profile UI |
| GET | `/api/v1/user/me/dashboard-summary` | `UserController.java:62` | `userService.getDashboardSummary` | get Dashboard Summary. | **USED** | features/account/api/query-hooks.ts; dashboard/profile UI |
| PUT | `/api/v1/user/me/notifications` | `UserController.java:70` | `userService.updateNotificationsSetting` | update Notifications Setting. | **PARTIALLY INTEGRATED** | lib/api/account.ts only; no component call site |

## Endpoints غير المستخدمة أو المربوطة جزئيًا

| Method | Endpoint | Controller | الوظيفة | الحالة | الأولوية | دليل الفرونت |
|---|---|---|---|---|---|---|
| DELETE | `/api/v1/user/admin/users/{targetUserId}` | `AdminController.java:48` | admin Delete User. | **PARTIALLY INTEGRATED** | MEDIUM | lib/api/admin.ts only; mutation has no UI call site |
| PUT | `/api/v1/user/admin/users/{targetUserId}/suspend` | `AdminController.java:60` | admin Suspend User. | **PARTIALLY INTEGRATED** | MEDIUM | lib/api/admin.ts only; mutation has no UI call site |
| PUT | `/api/v1/user/admin/users/{targetUserId}/unsuspend` | `AdminController.java:72` | admin Unsuspend User. | **PARTIALLY INTEGRATED** | MEDIUM | lib/api/admin.ts only; mutation has no UI call site |
| GET | `/api/v1/user/admin/dashboard` | `AdminController.java:86` | get Dashboard Statistics. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/users/search` | `AdminController.java:98` | search Users. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/users/{userId}` | `AdminController.java:112` | get User By Id. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/dashboard/recent-users` | `AdminController.java:122` | get Recent Users. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/payments` | `AdminController.java:134` | get All Payments. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/payments/{paymentId}` | `AdminController.java:148` | get Payment By Id. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found |
| POST | `/api/v1/user/admin/users/{targetUserId}/gift-credits` | `AdminController.java:161` | gift Credits To User. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/audit-logs` | `AdminController.java:176` | get Audit Logs. | **UNUSED** | LOW | No frontend client/BFF operation or UI call site found |
| GET | `/api/v1/user/admin/system-health` | `AdminController.java:189` | get System Health. | **UNUSED** | LOW | No frontend client/BFF operation or UI call site found |
| POST | `/api/v1/auth/refresh` | `AuthController.java:59` | refresh. | **PARTIALLY INTEGRATED** | HIGH | lib/auth/auth-api.server.ts and app/api/auth/[operation]/route.ts only; no UI call, handler falls through to 404 |
| GET | `/api/v1/credit-packages` | `CreditPackageController.java:30` | get All Packages. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found (admin package management) |
| POST | `/api/v1/credit-packages` | `CreditPackageController.java:37` | add Package. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found (admin package management) |
| PUT | `/api/v1/credit-packages/{packageId}` | `CreditPackageController.java:47` | update Package. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found (admin package management) |
| DELETE | `/api/v1/credit-packages/{packageId}` | `CreditPackageController.java:57` | delete Package. | **UNUSED** | MEDIUM | No frontend client/BFF operation or UI call site found (admin package management) |
| GET | `/api/v1/current-home/get` | `CurrentHomeController.java:30` | get All Current Homes. | **PARTIALLY INTEGRATED** | LOW | lib/api/admin.ts only; no component call site |
| GET | `/api/v1/current-home/me/neighborhood` | `CurrentHomeController.java:85` | get Neighborhood. | **PARTIALLY INTEGRATED** | MEDIUM | BFF allowlist only; no API client or UI consumer found |
| GET | `/api/v1/housing-preference/get` | `HousingPreferenceController.java:30` | get All Housing Preferences. | **PARTIALLY INTEGRATED** | LOW | lib/api/admin.ts only; no component call site |
| DELETE | `/api/v1/lifestyle-interest/me/{interestId}` | `LifestyleInterestController.java:57` | delete Lifestyle Interest. | **PARTIALLY INTEGRATED** | LOW | lib/api/lifestyle-interests.ts only; no UI call site for delete |
| POST | `/api/v1/moving-checklist/generate` | `MovingChecklistController.java:20` | generate Checklist. | **UNUSED** | MEDIUM | No frontend API client/BFF operation or UI consumer found |
| GET | `/api/v1/moving-checklist/get` | `MovingChecklistController.java:28` | get Checklist. | **UNUSED** | MEDIUM | No frontend API client/BFF operation or UI consumer found |
| PUT | `/api/v1/moving-checklist/toggle/{taskId}` | `MovingChecklistController.java:35` | toggle Task. | **UNUSED** | MEDIUM | No frontend API client/BFF operation or UI consumer found |
| DELETE | `/api/v1/moving-checklist/reset` | `MovingChecklistController.java:43` | reset Checklist. | **UNUSED** | MEDIUM | No frontend API client/BFF operation or UI consumer found |
| GET | `/api/v1/notification/me/unread` | `NotificationController.java:35` | get Unread Notifications. | **PARTIALLY INTEGRATED** | LOW | lib/api/notifications.ts only; unread list/delete method has no UI consumer |
| DELETE | `/api/v1/notification/me/{notificationId}` | `NotificationController.java:78` | delete Notification. | **PARTIALLY INTEGRATED** | LOW | lib/api/notifications.ts only; unread list/delete method has no UI consumer |
| PATCH | `/api/v1/place-preference/me/{placeId}/importance/{importance}` | `PlacePreferenceController.java:64` | update Importance. | **PARTIALLY INTEGRATED** | LOW | lib/api/places.ts only; no UI call site |
| GET | `/api/v1/property-comparison/get` | `PropertyComparisonController.java:31` | get All Comparisons. | **PARTIALLY INTEGRATED** | LOW | lib/api/admin.ts only; no component call site |
| GET | `/api/v1/property-comparison/me/compare-two/{firstSource}/{firstPropertyId}/{secondSource}/{secondPropertyId}` | `PropertyComparisonController.java:94` | compare Two Properties With Credits. | **PARTIALLY INTEGRATED** | MEDIUM | lib/api/insights.ts only; no UI call site |
| GET | `/api/v1/properties/search/{city}/{listingType}/{propertyType}/{maxPrice}` | `PropertyController.java:40` | localize; search. | **PARTIALLY INTEGRATED** | LOW | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/near-location/{city}/{listingType}/{propertyType}/{latitude}/{longitude}/{radiusKm}` | `PropertyController.java:60` | localize; get Near Location. | **PARTIALLY INTEGRATED** | LOW | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/by-districts/{city}/{listingType}/{propertyType}/{districts}` | `PropertyController.java:82` | localize; get By Districts. | **PARTIALLY INTEGRATED** | LOW | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/price-range/{city}/{listingType}/{propertyType}/{minPrice}/{maxPrice}` | `PropertyController.java:88` | localize; get By Price Range. | **PARTIALLY INTEGRATED** | LOW | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/sort/{city}/{listingType}/{sortBy}` | `PropertyController.java:94` | localize; sort Properties. | **PARTIALLY INTEGRATED** | LOW | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| GET | `/api/v1/properties/results-count/{city}/{listingType}` | `PropertyController.java:106` | get Results Count. | **PARTIALLY INTEGRATED** | LOW | BFF allowlist only; no API client or UI call site found (legacy/alternate search operations) |
| POST | `/api/v1/recommendations/me/suggest-neighborhoods` | `RecommendationController.java:66` | suggest Neighborhoods. | **PARTIALLY INTEGRATED** | MEDIUM | lib/api/insights.ts only; no UI call site for this method |
| PUT | `/api/v1/recommendations/me/selected-neighborhood` | `RecommendationController.java:75` | select Neighborhood. | **PARTIALLY INTEGRATED** | MEDIUM | lib/api/insights.ts only; no UI call site for this method |
| POST | `/api/v1/recommendations/me/selected-neighborhood-properties` | `RecommendationController.java:86` | get Selected Neighborhood Recommendations With Credits. | **PARTIALLY INTEGRATED** | MEDIUM | lib/api/insights.ts only; no UI call site for this method |
| PUT | `/api/v1/user/me/deactivate` | `UserController.java:46` | deactivate My Account. | **PARTIALLY INTEGRATED** | LOW | lib/api/account.ts only; no component call site |
| PUT | `/api/v1/user/me/notifications` | `UserController.java:70` | update Notifications Setting. | **PARTIALLY INTEGRATED** | LOW | lib/api/account.ts only; no component call site |

## ما الذي يستحق الربط أولًا؟

1. **POST `/api/v1/auth/refresh` — HIGH (جزئي)**: الـbackend و`authApi.refresh` موجودان، لكن مسار Next refresh لا يستدعيه؛ بعد شرط التنسيق الآمن يسقط إلى 404، ولا يوجد caller في الواجهة. لا يُنصح بتفعيله قبل وجود تنسيق آمن لدوران refresh token.
2. **مسارات إدارة المستخدمين والتفاصيل المالية** — MEDIUM: `GET /user/admin/users/search`, `/dashboard`, `/payments`، تفاصيل الحساب/الدفع، `gift-credits` ومؤشرات الإدارة غير مربوطة بـBFF/UI. صفحة الإدارة الحالية تستدعي فقط قائمة المستخدمين.
3. **إدارة حزم الرصيد** — MEDIUM: GET list وPOST/PUT/DELETE للحزم موجودة للـadmin فقط ولا يوجد API client/BFF/UI. يفضّل ربطها فقط إن كان مطلوبًا وجود شاشة تشغيلية للإدارة.
4. **Moving Checklist** — MEDIUM: generate/get/toggle/reset تتيح ميزة مستخدم كاملة لكنها لا تملك أي frontend integration حاليًا.
5. **توصيات اختيار الحي** — MEDIUM: suggest/select/selected-neighborhood-properties لها API client في `lib/api/insights.ts` لكن لم يظهر تنفيذ يستهلك هذه الدوال في Component أو Page.
6. **معلومات الحي الحالي** — MEDIUM: `/current-home/me/neighborhood` موجودة في BFF allowlist لكنها لا تملك API client أو UI caller؛ تحقّق هل المطلوب استخدامها أو إزالتها لاحقًا من عقد BFF.
7. **بحث المقارنة الثنائية** — MEDIUM: `compare-two` موجودة في API client/allowlist دون UI caller. واجهة المقارنة الحالية تستعمل `compare-multiple` للخصائص المحفوظة؛ تحقق هل endpoint الثنائية مطلوب.
8. **إعدادات الحساب** — LOW: deactivate وnotifications update لهما API client فقط ولا توجد call sites مرئية في واجهة الحساب؛ قد تكون أزرار الإعدادات مخفية أو الميزتان غير مطلوبة.
9. **Place importance وLifestyle delete** — LOW: لديهما دوال API لكنها لا تُستدعى؛ تأكد إن كانت الواجهة تقصد حذف العنصر أو تعديل أهميته بطرق أخرى.
10. **مسارات البحث القديمة** — LOW: search path-variable وnear-location/by-districts/price-range/sort/results-count تمر من allowlist العام فقط؛ واجهة البحث الحالية تستعمل query-based `/properties/search`، فلا تربطها إلا إذا كان لها consumer مطلوب.

## ميزات backend غير المستفاد منها في الواجهة

- **Moving checklist**: قائمة انتقال مولدة/مقروءة/معدلة/مصفرة بالكامل في backend، من دون feature أو route في Next.js.
- **وظائف Admin إضافية**: dashboard، بحث وتفاصيل المستخدم، إدارة payments، gifting credits، audit logs وsystem health؛ الصفحة الحالية تستخدم GET users فقط.
- **CRUD لإدارة Credit Packages**: backend admin endpoints غير متاحة في BFF ولا توجد صفحة إدارة لها.
- **اختيارات الحي الذكية**: اقتراح أحياء، تثبيت اختيار حي، ثم توصيات عقارية بحسب الحي؛ API functions موجودة لكن لم تصل إلى UI.
- **مسارات بحث بديلة/قديمة**: Kite search بحسب المسار أو location/district/price/sort/count ليست في API client؛ البحث الموجود يستخدم endpoint `/properties/search` بquery params.

## Endpoints التي لا تحتاج تكامل Frontend

- `POST /api/v1/payments/webhook` — callback من Moyasar إلى backend؛ ينبغي ألا يستدعيه المتصفح.
- مسارات `/api/v1/n8n/*` الثلاثة — أدوات أتمتة داخلية محمية بـinternal API key.
- endpoints إدارة credit packages هي غير مستخدمة حاليًا وليست Backend Only تقنيًا؛ يلزمها UI فقط إن كان المنتج يتطلب إدارة الحزم من MADAR admin.

## الملفات الدالة على التتبع

- Backend route source: `../Backend/src/main/java/com/example/madar/Controller/*Controller.java`.
- Browser API/BFF contract: `lib/api/operation-contracts.ts`, `lib/api/operations.server.ts`, `app/api/backend/[...path]/route.ts`.
- Auth BFF: `app/api/auth/[operation]/route.ts`, `lib/auth/auth-api.server.ts`, `lib/auth/client.ts`.
- API clients: `lib/api/*.ts`.
- Feature/query consumers: `features/account/api/query-hooks.ts`, `features/properties/*`, `features/recommendations/*`, `features/neighborhood/*`, `features/comparisons/*`, `features/payments/*`, `features/workspace/*`, `features/assistant/hooks/*`.
- التتبع ديناميكيًا: `/payments/me/{paymentId}/verify` يرسله browser كـPOST لكن BFF يحوله إلى GET قبل مطابقة عملية Spring، لذا صُنّف USED.

## حدود التحليل

هذا تصنيف ساكن للكود الموجود وقت التدقيق؛ لا يثبت نجاح استدعاء runtime أو توفر بيانات/صلاحيات المستخدم. الـServer Components التي تستدعي `getLocationCatalog` عبر `lib/locations/catalog.server.ts` احتُسبت كمستخدمة لأن صفحات البحث تستهلك `LocationPrefetch`. تعليقات الكود والأسماء وحدها لم تُعتبر caller. لا يوجد UNCERTAIN بعد فحص المسارات المولدة والمصادقة الخاصة؛ أي consumer خارجي خارج هذا الـcheckout غير داخل النطاق.
