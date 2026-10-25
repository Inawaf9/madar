package com.example.madar.Security;

import com.example.madar.Model.User;
import com.example.madar.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/** Returns 403 for an existing foreign resource; services retain their own checks. */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResourceOwnershipAccess {
    private final CurrentUserAccess currentUserAccess;
    private final CurrentHomeRepository homes;
    private final HousingPreferenceRepository housing;
    private final LifestyleInterestRepository interests;
    private final PlacePreferenceRepository places;
    private final SavedPropertyRepository savedProperties;
    private final PropertyComparisonRepository comparisons;
    private final NotificationRepository notifications;
    private final PaymentRepository payments;

    public void requireHome(Integer id) {
        requireOwner(homes.findById(id).map(home -> home.getUser()));
    }

    public void requireHousingPreference(Integer id) {
        requireOwner(housing.findById(id).map(preference -> preference.getUser()));
    }

    public void requireInterest(Integer id) {
        requireOwner(interests.findById(id).map(interest -> interest.getHousingPreference().getUser()));
    }

    public void requirePlace(Integer id) {
        requireOwner(places.findById(id).map(place -> place.getUser()));
    }

    public void requireSavedProperty(Integer id) {
        requireOwner(savedProperties.findById(id).map(property -> property.getUser()));
    }

    public void requireSavedProperties(List<Integer> ids) {
        Integer userId = currentUserAccess.getCurrentUserId();
        // Leave invalid list sizes/nulls to the unchanged business validation.
        if (ids == null || ids.size() < 2 || ids.size() > 4 || ids.contains(null)) return;
        for (Integer id : ids) {
            savedProperties.findById(id).ifPresent(property -> checkOwner(property.getUser(), userId));
        }
    }

    public void requireComparison(Integer id) {
        requireOwner(comparisons.findById(id).map(comparison -> comparison.getUser()));
    }

    public void requireNotification(Integer id) {
        requireOwner(notifications.findById(id).map(notification -> notification.getUser()));
    }

    public void requirePayment(Integer id) {
        requireOwner(payments.findById(id).map(payment -> payment.getUser()));
    }

    private void requireOwner(Optional<User> owner) {
        Integer userId = currentUserAccess.getCurrentUserId();
        owner.ifPresent(user -> checkOwner(user, userId));
    }

    private void checkOwner(User owner, Integer userId) {
        if (owner == null || !userId.equals(owner.getId())) {
            throw new AccessDeniedException("Forbidden");
        }
    }
}
