package com.example.madar.Service;

import com.example.madar.Api.ApiException;
import com.example.madar.Client.KiteClient;
import com.example.madar.DTO.In.Property.KiteDTO;
import com.example.madar.DTO.In.Property.PropertySearchRequestDTO;
import com.example.madar.DTO.Out.Property.MatchSummaryDTO;
import com.example.madar.DTO.Out.Property.PriceStatsDTO;
import com.example.madar.DTO.Out.Property.PropertyDTO;
import com.example.madar.DTO.Out.Property.PropertySearchResponseDTO;
import com.example.madar.Model.HousingPreference;
import com.example.madar.Model.User;
import com.example.madar.Repository.HousingPreferenceRepository;
import com.example.madar.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Set;
import java.util.Objects;

@RequiredArgsConstructor
@Service
public class PropertyService {

    private final KiteClient kiteClient;
    private final UserRepository userRepository;
    private final HousingPreferenceRepository housingPreferenceRepository;

    // Public discovery does not read users, saved preferences or commute/essential interests.
    public PropertySearchResponseDTO searchPublic(PropertySearchRequestDTO request, Map<String, List<String>> parameters) {
        Set<String> allowed = Set.of("city", "q", "type", "purpose", "neighborhoodId", "minPrice", "maxPrice",
                "minArea", "maxArea", "minBedrooms", "minBathrooms", "furnished", "rentFrequency", "sort", "limit", "cursor");
        for (Map.Entry<String, List<String>> parameter : parameters.entrySet()) {
            if (!allowed.contains(parameter.getKey())) {
                throw new ApiException("Unsupported search parameter: " + parameter.getKey());
            }
            if (parameter.getValue().size() != 1) {
                throw new ApiException("Search parameter must be supplied once: " + parameter.getKey());
            }
            if (parameter.getValue().get(0).isBlank()) {
                throw new ApiException("Search parameter must not be blank: " + parameter.getKey());
            }
        }
        if (request.getQ() != null && request.getQ().isBlank()) {
            throw new ApiException("Query must not be blank");
        }
        if (request.getCursor() != null && request.getCursor().isBlank()) {
            throw new ApiException("Cursor must not be blank");
        }
        if (request.getMinPrice() != null && request.getMaxPrice() != null
                && request.getMinPrice() > request.getMaxPrice()) {
            throw new ApiException("Minimum price must not exceed maximum price");
        }
        if ((request.getMinArea() != null && !Double.isFinite(request.getMinArea()))
                || (request.getMaxArea() != null && !Double.isFinite(request.getMaxArea()))
                || (request.getMinArea() != null && request.getMaxArea() != null && request.getMinArea() > request.getMaxArea())) {
            throw new ApiException("Invalid area range");
        }
        if ("sale".equals(request.getPurpose()) && request.getRentFrequency() != null) {
            throw new ApiException("Rent frequency cannot be combined with sale purpose");
        }

        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("city", request.getCity());
        putFilter(filters, "q", request.getQ());
        putFilter(filters, "property_type", "all".equals(request.getType()) ? null : request.getType());
        filters.put("listing_type", request.getPurpose());
        putFilter(filters, "neighborhood_id", request.getNeighborhoodId());
        putFilter(filters, "price_min", request.getMinPrice());
        putFilter(filters, "price_max", request.getMaxPrice());
        putFilter(filters, "area_min", request.getMinArea());
        putFilter(filters, "area_max", request.getMaxArea());
        putFilter(filters, "beds_min", request.getMinBedrooms());
        putFilter(filters, "bathrooms_min", request.getMinBathrooms());
        putFilter(filters, "furnished", request.getFurnished());
        putFilter(filters, "rent_frequency", request.getRentFrequency());
        String sort = switch (request.getSort()) {
            case "price" -> "price_asc";
            case "price-desc" -> "price_desc";
            case "price-drop" -> "price_drop";
            default -> request.getSort();
        };
        filters.put("sort", sort);
        filters.put("limit", request.getLimit());
        putFilter(filters, "cursor", request.getCursor());

        KiteDTO.ListResponse response = kiteClient.discoverListings(filters);
        if (response == null || response.getData() == null || response.getPagination() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Kite returned an incomplete search response");
        }
        KiteDTO.Pagination pagination = response.getPagination();
        if (pagination.getLimit() == null || pagination.getLimit() < 1
                || pagination.getHasMore() == null || pagination.getResultWindowReached() == null
                || (pagination.getHasMore() && !pagination.getResultWindowReached()
                && (pagination.getNextCursor() == null || pagination.getNextCursor().isBlank()))) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Kite returned incomplete pagination");
        }
        List<PropertyDTO> properties = new ArrayList<>();
        // Preserve the provider's complete page and order, including commercial properties and land.
        for (KiteDTO.Listing listing : response.getData()) {
            if (listing == null) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Kite returned an invalid listing");
            }
            properties.add(convertPublicListing(listing));
        }
        return new PropertySearchResponseDTO(properties, new PropertySearchResponseDTO.Pagination(
                pagination.getLimit(), pagination.getNextCursor(), pagination.getHasMore(), pagination.getResultWindowReached()));
    }

    private void putFilter(Map<String, Object> filters, String name, Object value) {
        if (value != null) {
            filters.put(name, value);
        }
    }

    private PropertyDTO convertPublicListing(KiteDTO.Listing listing) {
        PropertyDTO property = convert(listing);
        property.setExternalId(listing.getId() == null ? null : listing.getId().toString());
        if (property.getTitle() == null || property.getTitle().isBlank()) {
            property.setTitle(listing.getHeadline());
        }
        property.setDescription(listing.getDescription());
        property.setBathrooms(listing.getBathrooms());
        property.setPricePeriod("rent".equals(listing.getListingType()) ? "yearly"
                : "sale".equals(listing.getListingType()) ? "total" : null);
        if (listing.getPrice() != null && listing.getPrice().getAsPosted() != null) {
            property.setPostedPrice(listing.getPrice().getAsPosted().getAmount());
            property.setPostedPricePeriod(listing.getPrice().getAsPosted().getFrequency());
        }
        if (listing.getSource() != null) {
            property.setSourceUrl(listing.getSource().getUrl());
        }
        if (listing.getLocation() != null) {
            property.setNeighborhoodId(listing.getLocation().getNeighborhoodId());
        }
        List<String> images = listing.getImages() == null ? List.of()
                : listing.getImages().stream().filter(Objects::nonNull).toList();
        property.setImages(images);
        property.setImage(images.isEmpty() ? null : images.get(0));
        return property;
    }

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
        return convertPublicListing(response.getData());
    }

    //by my housing preference
    public List<PropertyDTO> getByPreferences(Integer userId){
        HousingPreference preference = getPreference(userId);
        String city = preference.getCity().toLowerCase();
        String listingType = preference.getListingType().toLowerCase();
        String propertyType = preference.getPropertyType().toLowerCase();
        int budget = preference.getMaxBudget().intValue();

        //no district:search the whole city
        if(preference.getDistrict() == null || preference.getDistrict().isEmpty()){
            return fetch(city, listingType, propertyType, null, budget);
        }

        //district ask Kite for this neighborhood only
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
        propertyType = checkType(propertyType);
        checkSearch(city, listingType, propertyType);
        city = city.toLowerCase();

        KiteDTO.NeighborhoodsResponse response = kiteClient.getNeighborhoods(city);
        if(response == null || response.getData() == null){
            throw new ApiException("Could not load neighborhoods for " + city);
        }

        String ids = "";
        for(String district : districts.split(",")){
            String name = district.trim();
            Integer id = null;
            for(KiteDTO.Neighborhood neighborhood : response.getData()){
                if(name.equals(neighborhood.getNameAr()) || name.equalsIgnoreCase(neighborhood.getNameEn())){
                    id = neighborhood.getId();
                    break;
                }
            }


            if(id== null){
                throw new ApiException("District '" + name + "' was not found in " + city);
            }


            if(!ids.isEmpty()){
                ids += ",";
            }
            ids += id;
        }


        return convertAll(kiteClient.searchInNeighborhoods(city, listingType.toLowerCase(), propertyType, ids));
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
        Integer cheapest = null;
        KiteDTO.ListResponse cheapestResponse = kiteClient.getCheapestListing(city, listingType, propertyType, budget);
        if(cheapestResponse != null && cheapestResponse.getData() != null && !cheapestResponse.getData().isEmpty()){
            cheapest = cheapestResponse.getData().get(0).getPrice().getYearlySar();
        }
        return new MatchSummaryDTO(budget, total, inMyDistrict, cheapest);
    }

    //similar properties (same city and type, price within 20%)
    public List<PropertyDTO> getSimilar(String source, String externalId){
        PropertyDTO base = getPropertyById(source, externalId);
        if(base.getPrice() == null || base.getCity() == null){
            throw new ApiException("This property does not have enough data to find similar ones");
        }
        int minPrice = (int) (base.getPrice() * 0.8);
        int maxPrice = (int) (base.getPrice() * 1.2);
        List<PropertyDTO> properties = fetch(base.getCity(), base.getListingType(), base.getPropertyType(), minPrice, maxPrice);

        List<PropertyDTO> similar = new ArrayList<>();
        for(PropertyDTO property : properties){
            if(!property.getExternalId().equals(base.getExternalId())){
                similar.add(property);
            }
        }
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
    public double calculateDistanceKm(double lat1, double lng1, double lat2, double lng2){
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

        if(listing.getPrice() != null){
            property.setPrice(listing.getPrice().getYearlySar());
        }
        if(listing.getSource() != null){
            property.setSourceName(listing.getSource().getName());
        }
        if(listing.getLocation() != null){
            property.setCity(listing.getLocation().getCity());
            property.setNeighborhood(listing.getLocation().getNeighborhood());
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
        String name = district.trim();
        for(KiteDTO.Neighborhood neighborhood : response.getData()){
            if(name.equals(neighborhood.getNameAr()) || name.equalsIgnoreCase(neighborhood.getNameEn())){
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
}
