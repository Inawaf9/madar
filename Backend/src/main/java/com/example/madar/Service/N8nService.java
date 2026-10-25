package com.example.madar.Service;

import com.example.madar.DTO.Out.N8n.PriceChangeDTO;
import com.example.madar.DTO.Out.N8n.UserPriceAlertDTO;
import com.example.madar.DTO.Out.Property.PropertyDTO;
import com.example.madar.Model.SavedProperty;
import com.example.madar.Model.User;
import com.example.madar.Repository.SavedPropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class N8nService {

    private final SavedPropertyRepository savedPropertyRepository;
    private final PropertyService propertyService;
    private final NotificationService notificationService;

    //check the price of every saved property, and return one alert per user with all the changes (one email per user)
    public List<UserPriceAlertDTO> checkSavedPrices(){
        //userId -> the alert of this user
        Map<Integer, UserPriceAlertDTO> alerts = new LinkedHashMap<>();

        for(SavedProperty saved : savedPropertyRepository.findAll()){
            try{
                PropertyDTO property = propertyService.getPropertyById(saved.getSource(), saved.getExternalPropertyId());
                Integer newPrice = property.getPrice();
                Integer oldPrice = saved.getLastKnownPrice();
                if(newPrice == null){
                    continue;
                }
                //first check for this property: only remember the price
                if(oldPrice == null){
                    saved.setLastKnownPrice(newPrice);
                    savedPropertyRepository.save(saved);
                    continue;
                }
                if(newPrice.equals(oldPrice)){
                    continue;
                }
                //the price changed: save the new one
                saved.setLastKnownPrice(newPrice);
                savedPropertyRepository.save(saved);

                //only users who want notifications
                User user = saved.getUser();
                if(!Boolean.TRUE.equals(user.getNotificationsEnabled()) || !Boolean.TRUE.equals(user.getActive())
                        || Boolean.TRUE.equals(user.getSuspendedByAdmin())){
                    continue;
                }

                String title = saved.getTitleSnapshotAr();
                if(title == null || title.isBlank()){
                    title = property.getTitle();
                }
                String direction = newPrice < oldPrice ? "DOWN" : "UP";
                String message = "نزل سعر «" + title + "» من " + oldPrice + " إلى " + newPrice + " ريال";
                if(direction.equals("UP")){
                    message = "ارتفع سعر «" + title + "» من " + oldPrice + " إلى " + newPrice + " ريال";
                }
                String url = "/properties/" + saved.getSource() + "/" + saved.getExternalPropertyId();

                //one notification in Madar for every property
                notificationService.createNotification(user.getId(), "تحديث على سعر عقار محفوظ", message, "PRICE_CHANGE", url);

                //add the change to this user's alert (create it the first time)
                UserPriceAlertDTO alert = alerts.get(user.getId());
                if(alert == null){
                    alert = new UserPriceAlertDTO(user.getId(), user.getFullName(), user.getEmail(), new ArrayList<>());
                    alerts.put(user.getId(), alert);
                }
                alert.getChanges().add(new PriceChangeDTO(title, oldPrice, newPrice, direction, url));
                System.out.println("n8n price change: " + title + " " + oldPrice + " -> " + newPrice);
            }catch (Exception e){
                //the listing was removed or Kite failed: skip it, keep checking the others
                System.out.println("n8n price check skipped for saved property " + saved.getId() + ": " + e.getMessage());
            }
        }
        return new ArrayList<>(alerts.values());
    }
}