package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.Client.KiteClient;
import com.example.madar.DTO.In.KiteDTO;
import com.example.madar.DTO.Out.MatchSummaryDTO;
import com.example.madar.DTO.Out.PriceStatsDTO;
import com.example.madar.DTO.Out.PropertyDTO;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Model.User;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.HashMap;
import java.util.Map;

@RequiredArgsConstructor
@Service
public class PropertyService {

    private final KiteClient kiteClient;
    private final UserRepository userRepository;
    private final HousingPreferenceRepository housingPreferenceRepository;
    //neighborhood lists already loaded from Kite, one per city (so we do not call Kite every time)
    private final Map<String, List<KiteDTO.Neighborhood>> neighborhoodsByCity = new HashMap<>();


    //search
    public List<PropertyDTO> search(String city, String listingType, String propertyType, Integer maxPrice){
        return fetch(city, listingType, checkType(propertyType), null, maxPrice);
    }






    //get property details
    public PropertyDTO getPropertyById(String source, String externalId){
        if(!source.equalsIgnoreCase("KITE")){
            throw new ApiException("Only KITE source is supported");
        }
        KiteDTO.SingleResponse response = kiteClient.getListing(externalId);
        if(response==null || response.getData()== null){
            throw new ApiException("Property not found");
        }
        return convert(response.getData());
    }


    //properties that match my housing preference inside my district
    public List<PropertyDTO> getByPreferenceInMyDistrict(Integer userId){
        HousingPreference preference = getPreference(userId);

        //this endpoint needs a district, the whole city is within-budget
        if(preference.getDistrict() == null || preference.getDistrict().isEmpty()){
            throw new ApiException("Add a district to your preference, or use within-budget to search the whole city");
        }

        String city = preference.getCity().toLowerCase();
        String listingType = preference.getListingType().toLowerCase();
        String propertyType = preference.getPropertyType().toLowerCase();
        int budget = preference.getMaxBudget().intValue();

        //ask Kite for this neighborhood only
        Integer neighborhoodId = findNeighborhoodId(city, preference.getDistrict());
        return convertAll(kiteClient.searchInNeighborhood(city, listingType, propertyType, budget, neighborhoodId));
    }







    //near a location,Kite searches inside a box around the point
    public List<PropertyDTO> getNearLocation(String city, String listingType, String propertyType, Double latitude, Double longitude, Double radiusKm){
        if(radiusKm<=0||radiusKm>50){
            throw new ApiException("Radius must be between 0 and 50 km");
        }

        if(latitude<16||latitude>33||longitude<34||longitude > 56){
            throw new ApiException("Location is outside Saudi Arabia");
        }
        propertyType = checkType(propertyType);
        checkSearch(city, listingType, propertyType);

        //1 degree of latitude about 111 km
        double latDiff = radiusKm / 111.0;
        double lngDiff = radiusKm / (111.0 * Math.cos(Math.toRadians(latitude)));
        String bbox = String.format(Locale.US, "%.5f,%.5f,%.5f,%.5f",
                longitude - lngDiff, latitude - latDiff, longitude + lngDiff, latitude + latDiff);
        List<PropertyDTO> properties = convertAll(kiteClient.searchInBox(city.toLowerCase(), listingType.toLowerCase(), propertyType, bbox));

        //the box has corners, so keep only what is inside the real circle
        List<PropertyDTO> nearby = new ArrayList<>();
        for(PropertyDTO property : properties){
            if(property.getLatitude() == null || property.getLongitude() == null){
                continue;
            }
            double distance = calculateDistanceKm(latitude, longitude, property.getLatitude(), property.getLongitude());
            if(distance <= radiusKm){
                property.setDistanceKm(Math.round(distance * 10) / 10.0);
                nearby.add(property);
            }
        }
        nearby.sort(Comparator.comparing(PropertyDTO::getDistanceKm));
        return nearby;
    }





    //properties within my budget in the whole city (from my housing preference)
    public List<PropertyDTO> getWithinBudget(Integer userId){
        HousingPreference preference = getPreference(userId);
        int budget = preference.getMaxBudget().intValue();
        return fetch(preference.getCity(), preference.getListingType(), preference.getPropertyType(), null, budget);
    }






    //cheaper than my budget by a margin
    public List<PropertyDTO> getUnderBudgetMargin(Integer userId, Integer margin){
        HousingPreference preference = getPreference(userId);
        int budget = preference.getMaxBudget().intValue();
        if(margin <= 0 || margin >= budget){
            throw new ApiException("Margin must be more than 0 and less than your budget");
        }
        return fetch(preference.getCity(), preference.getListingType(), preference.getPropertyType(), null, budget - margin);
    }






    //several districts حيين او اكثر عادي
    public List<PropertyDTO> getByDistricts(String city, String listingType, String propertyType, String districts){
        return getByDistrictsAndPrice(city, listingType, propertyType, districts, null, null);
    }








    //several districts with an optional price range (prices can be null)
    public List<PropertyDTO> getByDistrictsAndPrice(String city, String listingType, String propertyType, String districts, Integer minPrice, Integer maxPrice){
        propertyType = checkType(propertyType);
        checkSearch(city, listingType, propertyType);
        city = city.toLowerCase();
        if(minPrice != null && maxPrice != null && minPrice > maxPrice){
            throw new ApiException("Invalid price range");
        }

        KiteDTO.NeighborhoodsResponse response = kiteClient.getNeighborhoods(city);
        if(response == null || response.getData() == null){
            throw new ApiException("Could not load neighborhoods for " + city);
        }

        //Arabic comma "،" works like ","
        districts = districts.replace("،", ",");
        String ids = "";
        for(String district : districts.split(",")){
            String name = normalizeName(district);
            //skip empty names like "النرجس,"
            if(name.isEmpty()){
                continue;
            }
            Integer id = null;
            for(KiteDTO.Neighborhood neighborhood : response.getData()){
                if(name.equals(normalizeName(neighborhood.getNameAr())) || name.equals(normalizeName(neighborhood.getNameEn()))){
                    id = neighborhood.getId();
                    break;
                }
            }

            if(id == null){
                throw new ApiException("District '" + district.trim() + "' was not found in " + city);
            }

            if(!ids.isEmpty()){
                ids += ",";
            }
            ids += id;
        }
        if(ids.isEmpty()){
            throw new ApiException("Please write at least one district");
        }

        return convertAll(kiteClient.searchInNeighborhoodsWithPrice(city, listingType.toLowerCase(), propertyType, minPrice, maxPrice, ids));
    }







    //price range
    public List<PropertyDTO> getByPriceRange(String city, String listingType, String propertyType, Integer minPrice, Integer maxPrice){
        if(minPrice < 0 || maxPrice <= 0 || minPrice > maxPrice){
            throw new ApiException("Invalid price range");
        }
        return fetch(city, listingType, checkType(propertyType), minPrice, maxPrice);
    }

    //sort the whole market: price, price-desc, newest, price-drop
    public List<PropertyDTO> sortProperties(String city, String listingType, String sortBy){
        checkSearch(city, listingType, null);
        String sort;
        if(sortBy.equalsIgnoreCase("price")){
            sort = "price_asc";
        }else if(sortBy.equalsIgnoreCase("price-desc")){
            sort = "price_desc";

        }else if(sortBy.equalsIgnoreCase("newest")){
            sort = "newest";

        }else if(sortBy.equalsIgnoreCase("price-drop")){
            sort = "price_drop";


        }else{
            throw new ApiException("Sort must be price, price-desc, newest or price-drop");
        }
        return convertAll(kiteClient.searchSorted(city.toLowerCase(), listingType.toLowerCase(), null, null, sort, 20));
    }







    //price stats for one housing type (real numbers from Kite)
    public PriceStatsDTO getPriceStats(String city, String listingType, String propertyType){
        if(propertyType.equalsIgnoreCase("all")){
            throw new ApiException("Please choose one property type for price stats");
        }
        checkSearch(city, listingType, propertyType);
        city = city.toLowerCase();
        listingType = listingType.toLowerCase();
        propertyType = propertyType.toLowerCase();

        Integer total=0;
        KiteDTO.CountResponse countResponse=kiteClient.countListings(city, listingType, propertyType, null, null);
        if(countResponse != null&& countResponse.getData()!=null&&countResponse.getData().getTotal() != null){
            total = countResponse.getData().getTotal();
        }
        Integer minPrice = getFirstPrice(kiteClient.searchSorted(city, listingType, propertyType, null, "price_asc", 1));
        Integer maxPrice = getFirstPrice(kiteClient.searchSorted(city, listingType, propertyType, null, "price_desc", 1));

        return new PriceStatsDTO(city, listingType, propertyType, total, minPrice, maxPrice);
    }






    //results count
    public Integer getResultsCount(String city, String listingType){
        checkSearch(city, listingType, null);
        KiteDTO.CountResponse response = kiteClient.countListings(city.toLowerCase(), listingType.toLowerCase(), null, null, null);
        if(response == null || response.getData() == null || response.getData().getTotal() == null){
            return 0;
        }
        return response.getData().getTotal();
    }






    //match summary for my housing preference
    public MatchSummaryDTO getMatchSummary(Integer userId){
        HousingPreference preference = getPreference(userId);
        int budget=preference.getMaxBudget().intValue();
        String city=preference.getCity().toLowerCase();
        String listingType=preference.getListingType().toLowerCase();
        String propertyType=preference.getPropertyType().toLowerCase();

        // count in my district
        Integer inMyDistrict = null;
        if(preference.getDistrict() != null && !preference.getDistrict().isEmpty()){
            Integer neighborhoodId = findNeighborhoodId(city, preference.getDistrict());
            KiteDTO.CountResponse districtResponse = kiteClient.countInNeighborhood(city, listingType, propertyType, budget, neighborhoodId);
            inMyDistrict = 0;
            if(districtResponse != null && districtResponse.getData() != null && districtResponse.getData().getTotal() != null){
                inMyDistrict = districtResponse.getData().getTotal();
            }
        }
        // total in the market
        KiteDTO.CountResponse countResponse = kiteClient.countListings(city, listingType, propertyType, null, budget);
        Integer total = 0;
        if(countResponse != null && countResponse.getData() != null && countResponse.getData().getTotal() != null){
            total = countResponse.getData().getTotal();
        }
        //real cheapest in the market
        Integer cheapest = getFirstPrice(kiteClient.getCheapestListing(city, listingType, propertyType, budget));
        return new MatchSummaryDTO(budget, total, inMyDistrict, cheapest);
    }






    //similar properties: same type, price within 20%, rooms ±1, within 5 km of the property, nearest first
    public List<PropertyDTO> getSimilar(String source, String externalId){
        PropertyDTO base = getPropertyById(source, externalId);
        if(base.getPrice() == null || base.getCity() == null){
            throw new ApiException("This property does not have enough data to find similar ones");
        }
        int minPrice = (int) (base.getPrice() * 0.8);
        int maxPrice = (int) (base.getPrice() * 1.2);

        //no location: search the whole city by price and rooms only
        if(base.getLatitude() == null || base.getLongitude() == null){
            List<PropertyDTO> properties = fetch(base.getCity(), base.getListingType(), base.getPropertyType(), minPrice, maxPrice);
            List<PropertyDTO> similar = new ArrayList<>();
            for(PropertyDTO property : properties){
                if(property.getExternalId().equals(base.getExternalId())){
                    continue;
                }
                //bedrooms: at most 1 room difference (skip the check if one of them is unknown)
                if(base.getBedrooms() != null && property.getBedrooms() != null && Math.abs(property.getBedrooms() - base.getBedrooms()) > 1){
                    continue;
                }
                similar.add(property);
            }
            return similar;
        }

        //box of 5 km around the property
        double radiusKm = 5;
        double latDiff = radiusKm / 111.0;
        double lngDiff = radiusKm / (111.0 * Math.cos(Math.toRadians(base.getLatitude())));
        String bbox = String.format(Locale.US, "%.5f,%.5f,%.5f,%.5f",
                base.getLongitude() - lngDiff, base.getLatitude() - latDiff, base.getLongitude() + lngDiff, base.getLatitude() + latDiff);

        List<PropertyDTO> properties = convertAll(kiteClient.searchInBoxWithPrice(base.getCity().toLowerCase(), base.getListingType().toLowerCase(),
                base.getPropertyType().toLowerCase(), minPrice, maxPrice, bbox));

        //keep only the real circle, skip the property itself, nearest first
        List<PropertyDTO> similar = new ArrayList<>();
        for(PropertyDTO property : properties){
            if(property.getExternalId().equals(base.getExternalId()) || property.getLatitude() == null || property.getLongitude() == null){
                continue;
            }
            //bedrooms: at most 1 room difference (skip the check if one of them is unknown)
            if(base.getBedrooms() != null && property.getBedrooms() != null && Math.abs(property.getBedrooms() - base.getBedrooms()) > 1){
                continue;
            }
            double distance = calculateDistanceKm(base.getLatitude(), base.getLongitude(), property.getLatitude(), property.getLongitude());
            if(distance <= radiusKm){
                property.setDistanceKm(Math.round(distance * 10) / 10.0);
                similar.add(property);
            }
        }
        similar.sort(Comparator.comparing(PropertyDTO::getDistanceKm));
        return similar;
    }





    /////Helper methods/////

    //check + call Kite + convert
    private List<PropertyDTO> fetch(String city, String listingType, String propertyType, Integer minPrice, Integer maxPrice){
        checkSearch(city, listingType, propertyType);
        if(propertyType != null){
            propertyType = propertyType.toLowerCase();
        }
        return convertAll(kiteClient.searchListings(city.toLowerCase(), listingType.toLowerCase(), propertyType, minPrice, maxPrice));
    }

    private HousingPreference getPreference(Integer userId){
        User user = userRepository.findUserById(userId);
        if(user == null){
            throw new ApiException("User not found");
        }
        HousingPreference preference = housingPreferenceRepository.findHousingPreferenceByUser_Id(userId);
        if(preference == null){
            throw new ApiException("Please add your housing preference first");
        }
        return preference;
    }

    //distance between two points in km
    //معادلة Haversine تحسب المسافة الحقيقية على سطح الكرة الأرضية من خطوط الطول والعرض. 6371 هو نصف قطر الأرض
    private double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2){
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private void checkSearch(String city, String listingType, String propertyType){
        if(city == null || city.isEmpty()){
            throw new ApiException("City is required");
        }
        if(listingType == null || (!listingType.equalsIgnoreCase("rent") && !listingType.equalsIgnoreCase("sale"))){
            throw new ApiException("Listing type must be rent or sale");
        }
        if(propertyType != null && !isResidential(propertyType)){
            throw new ApiException("Property type must be apartment, villa, floor, duplex, building or all");
        }
    }

    //housing only: no offices, shops, warehouses or land
    private boolean isResidential(String propertyType){
        return propertyType != null && propertyType.toLowerCase().matches("^(apartment|villa|floor|duplex|building)$");
    }

    //"all" = every housing type, otherwise lowercase it
    private String checkType(String propertyType){
        if(propertyType == null || propertyType.equalsIgnoreCase("all")){
            return null;
        }
        return propertyType.toLowerCase();
    }

    private PropertyDTO convert(KiteDTO.Listing listing){
        PropertyDTO property = new PropertyDTO();
        property.setExternalId(String.valueOf(listing.getId()));
        property.setSource("KITE");
        if(listing.getTitle() != null){
            property.setTitle(listing.getTitle());
        }else{
            property.setTitle(listing.getHeadline());
        }
        property.setListingUrl(listing.getUrl());
        property.setPropertyType(listing.getPropertyType());
        property.setListingType(listing.getListingType());
        property.setBedrooms(listing.getBedrooms());
        property.setAreaSqm(listing.getAreaSqm());
        property.setUpdatedAt(listing.getUpdatedAt());
        //the owner's description, and Kite's English translation of it
        property.setDescription(listing.getDescription());
        property.setDescriptionEn(listing.getDescriptionEn());

        if(listing.getPrice() != null){
            property.setPrice(listing.getPrice().getYearlySar());
        }
        if(listing.getSource() != null){
            property.setSourceName(listing.getSource().getName());
        }
        if(listing.getLocation() != null){
            property.setCity(listing.getLocation().getCity());
            property.setNeighborhood(listing.getLocation().getNeighborhood());
            property.setNeighborhoodEn(listing.getLocation().getNeighborhoodEn());
            property.setLatitude(listing.getLocation().getLat());
            property.setLongitude(listing.getLocation().getLng());
        }
        if(listing.getImages() != null && !listing.getImages().isEmpty()){
            property.setImage(listing.getImages().get(0));
        }
        return property;
    }

    //find neighborhood id by its name (Arabic or English)
    private Integer findNeighborhoodId(String city, String district){
        KiteDTO.NeighborhoodsResponse response = kiteClient.getNeighborhoods(city);
        if(response == null || response.getData() == null){
            throw new ApiException("Could not load neighborhoods for " + city);
        }
        String name = normalizeName(district);
        for(KiteDTO.Neighborhood neighborhood : response.getData()){
            if(name.equals(normalizeName(neighborhood.getNameAr())) || name.equals(normalizeName(neighborhood.getNameEn()))){
                return neighborhood.getId();
            }
        }
        throw new ApiException("District '" + district + "' was not found in " + city);
    }

    //Kite response list of PropertyDTO (housing only)
    private List<PropertyDTO> convertAll(KiteDTO.ListResponse response){
        List<PropertyDTO> properties = new ArrayList<>();
        if(response == null || response.getData() == null){
            return properties;
        }
        for(KiteDTO.Listing listing : response.getData()){
            PropertyDTO property = convert(listing);
            if(isResidential(property.getPropertyType())){
                properties.add(property);
            }
        }
        return properties;
    }

    //price of the first listing in a response
    private Integer getFirstPrice(KiteDTO.ListResponse response){
        if(response == null || response.getData() == null || response.getData().isEmpty()){
            return null;
        }
        return convert(response.getData().get(0)).getPrice();
    }

    //districts in a city whose name contains the text (Arabic or English)
    public List<String> searchDistricts(String city, String text){
        KiteDTO.NeighborhoodsResponse response = kiteClient.getNeighborhoods(city.toLowerCase());
        if(response == null || response.getData() == null){
            throw new ApiException("Could not load neighborhoods for " + city);
        }
        String search = normalizeName(text);
        List<String> names = new ArrayList<>();
        //empty text (like "حي" only) would match every district
        if(search.isEmpty()){
            return names;
        }
        for(KiteDTO.Neighborhood neighborhood : response.getData()){
            boolean arabic = normalizeName(neighborhood.getNameAr()).contains(search);
            boolean english = normalizeName(neighborhood.getNameEn()).contains(search);
            if(arabic || english){
                names.add(neighborhood.getNameAr());
            }
            if(names.size() == 10){
                break;
            }
        }
        return names;
    }

    //make district names comparable: Arabic digits to English, remove "حي" and all spaces
    private String normalizeName(String name){
        if(name == null){
            return "";
        }
        String arabic = "٠١٢٣٤٥٦٧٨٩";
        String clean = "";
        for(char c : name.toCharArray()){
            int index = arabic.indexOf(c);
            if(index >= 0){
                clean += index;
            }else{
                clean += c;
            }
        }
        clean = clean.replace("حي ", "").replace(" ", "").trim().toLowerCase();
        return clean;
    }


    /////Language/////

    //show the listings in the frontend language (ar or en). It returns copies, the original list does not change
    public List<PropertyDTO> localize(List<PropertyDTO> properties, String lang){
        lang = checkLang(lang);
        List<PropertyDTO> result = new ArrayList<>();
        for(PropertyDTO property : properties){
            result.add(localizeOne(property, lang));
        }
        return result;
    }

    //one listing in the chosen language
    public PropertyDTO localizeOne(PropertyDTO property, String lang){
        lang = checkLang(lang);
        PropertyDTO copy = new PropertyDTO();
        copy.setExternalId(property.getExternalId());
        copy.setSource(property.getSource());
        copy.setSourceName(property.getSourceName());
        copy.setListingUrl(property.getListingUrl());
        copy.setCity(property.getCity());
        copy.setPropertyType(property.getPropertyType());
        copy.setListingType(property.getListingType());
        copy.setPrice(property.getPrice());
        copy.setBedrooms(property.getBedrooms());
        copy.setAreaSqm(property.getAreaSqm());
        copy.setLatitude(property.getLatitude());
        copy.setLongitude(property.getLongitude());
        copy.setImage(property.getImage());
        copy.setUpdatedAt(property.getUpdatedAt());
        copy.setDistanceKm(property.getDistanceKm());
        copy.setNeighborhoodEn(property.getNeighborhoodEn());
        copy.setDescriptionEn(property.getDescriptionEn());

        //keep the owner's title, and build a new one in the chosen language
        if(property.getOriginalTitle() != null){
            copy.setOriginalTitle(property.getOriginalTitle());
        }else{
            copy.setOriginalTitle(property.getTitle());
        }
        //description: Kite's English translation for en, the owner's text for ar
        if(lang.equals("en") && property.getDescriptionEn() != null && !property.getDescriptionEn().isBlank()){
            copy.setDescription(property.getDescriptionEn());
        }else{
            copy.setDescription(property.getDescription());
        }
        copy.setNeighborhood(neighborhoodName(property, lang));
        copy.setCityName(cityName(property.getCity(), lang));
        copy.setTitle(buildTitle(copy, lang));
        return copy;
    }

    //only ar or en, empty means ar
    public String checkLang(String lang){
        if(lang == null || lang.isBlank()){
            return "ar";
        }
        lang = lang.toLowerCase();
        if(!lang.equals("ar") && !lang.equals("en")){
            throw new ApiException("Language must be ar or en");
        }
        return lang;
    }

    //the district name in the chosen language: Kite sends both names, the neighborhoods list is only a backup
    private String neighborhoodName(PropertyDTO property, String lang){
        String ar = property.getNeighborhood();
        String en = property.getNeighborhoodEn();

        if(lang.equals("en")){
            if(en != null && !en.isBlank()){
                return en;
            }
            return findInList(property.getCity(), ar, "en");
        }

        //Arabic: no Arabic name, but we have the English one
        if((ar == null || ar.isBlank()) && en != null && !en.isBlank()){
            return findInList(property.getCity(), en, "ar");
        }
        //Kite sometimes puts an English name in the Arabic field
        if(ar != null && !ar.matches(".*[\\u0600-\\u06FF].*")){
            return findInList(property.getCity(), ar, "ar");
        }
        return ar;
    }





    //backup: find the district in Kite's neighborhoods list and return its name in the chosen language
    private String findInList(String city, String name, String lang){
        if(city == null || name == null || name.isBlank()){
            return name;
        }
        String search = normalizeName(name);
        for(KiteDTO.Neighborhood neighborhood : getCityNeighborhoods(city)){
            if(search.equals(normalizeName(neighborhood.getNameAr())) || search.equals(normalizeName(neighborhood.getNameEn()))){
                if(lang.equals("en") && neighborhood.getNameEn() != null){
                    return neighborhood.getNameEn();
                }
                if(lang.equals("ar") && neighborhood.getNameAr() != null){
                    return neighborhood.getNameAr();
                }
            }
        }
        //not found in the list: keep it as Kite sent it
        return name;
    }





    //load the neighborhoods of a city one time only
    private List<KiteDTO.Neighborhood> getCityNeighborhoods(String city){
        city = city.toLowerCase();
        if(!neighborhoodsByCity.containsKey(city)){
            List<KiteDTO.Neighborhood> list = new ArrayList<>();
            try{
                KiteDTO.NeighborhoodsResponse response = kiteClient.getNeighborhoods(city);
                if(response != null && response.getData() != null){
                    list = response.getData();
                }
            }catch (Exception e){
                //Kite failed: do not save, try again next time
                return list;
            }
            neighborhoodsByCity.put(city, list);
        }
        return neighborhoodsByCity.get(city);
    }

    //city name for the frontend
    private String cityName(String city, String lang){
        if(city == null || city.isBlank()){
            return city;
        }
        String code = city.toLowerCase();
        if(lang.equals("ar")){
            if(code.equals("riyadh")){
                return "الرياض";
            }
            if(code.equals("jeddah")){
                return "جدة";
            }
            if(code.equals("dammam")){
                return "الدمام";
            }
            if(code.equals("khobar")){
                return "الخبر";
            }
            if(code.equals("makkah")){
                return "مكة المكرمة";
            }
            if(code.equals("madinah")){
                return "المدينة المنورة";
            }
            return city;
        }
        return code.substring(0, 1).toUpperCase() + code.substring(1);
    }

    //title built from the listing data in the chosen language, like: شقة 3 غرف للإيجار في الملقا
    private String buildTitle(PropertyDTO property, String lang){
        String type = "";
        if(property.getPropertyType() != null){
            type = property.getPropertyType().toLowerCase();
        }
        String place = property.getNeighborhood();
        if(place == null || place.isBlank()){
            place = property.getCityName();
        }

        if(lang.equals("ar")){
            String title = "عقار";
            if(type.equals("apartment")){
                title = "شقة";
            }else if(type.equals("villa")){
                title = "فيلا";
            }else if(type.equals("floor")){
                title = "دور";
            }else if(type.equals("duplex")){
                title = "دوبلكس";
            }else if(type.equals("building")){
                title = "عمارة";
            }
            if(property.getBedrooms() != null){
                if(property.getBedrooms() == 1){
                    title += " غرفة وحدة";
                }else{
                    title += " " + property.getBedrooms() + " غرف";
                }
            }
            if("rent".equalsIgnoreCase(property.getListingType())){
                title += " للإيجار";
            }else if("sale".equalsIgnoreCase(property.getListingType())){
                title += " للبيع";
            }
            if(place != null){
                title += " في " + place;
            }
            return title;
        }

        String title = type.isEmpty() ? "property" : type;
        if(property.getBedrooms() != null){
            title = property.getBedrooms() + "-bedroom " + title;
        }
        if("rent".equalsIgnoreCase(property.getListingType())){
            title += " for rent";
        }else if("sale".equalsIgnoreCase(property.getListingType())){
            title += " for sale";
        }
        if(place != null){
            title += " in " + place;
        }
        return title.substring(0, 1).toUpperCase() + title.substring(1);
    }
}