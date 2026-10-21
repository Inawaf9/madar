package com.example.madar.Client;

import com.example.madar.Api.ApiException;
import com.example.madar.DTO.In.KiteDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class KiteClient {

    private final RestClient restClient;

    public KiteClient(
            RestClient.Builder builder,
            @Value("${kite.base-url}") String baseUrl,
            @Value("${kite.api-key}") String apiKey) {

        this.restClient = builder.clone()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .build();
    }
    //search listings
    public KiteDTO.ListResponse searchListings(String city, String listingType, String propertyType, Integer minPrice, Integer maxPrice){
        String url = "/listings?city=" + city + "&listing_type=" + listingType + "&limit=20";
        url = addFilters(url, propertyType, minPrice, maxPrice);
        try{
            return restClient.get().uri(url).retrieve().body(KiteDTO.ListResponse.class);
        }catch (HttpClientErrorException e){
            throw new ApiException(getErrorMessage(e.getStatusCode().value()));
        }catch (RestClientException e){
            throw new ApiException("Kite is unavailable right now");
        }
    }

    //count listings
    public KiteDTO.CountResponse countListings(String city, String listingType, String propertyType, Integer minPrice, Integer maxPrice){
        String url = "/listings/count?city=" + city + "&listing_type=" + listingType;
        url = addFilters(url, propertyType, minPrice, maxPrice);
        try{
            return restClient.get().uri(url).retrieve().body(KiteDTO.CountResponse.class);
        }catch (HttpClientErrorException e){
            throw new ApiException(getErrorMessage(e.getStatusCode().value()));
        }catch (RestClientException e){
            throw new ApiException("Kite is unavailable right now");
        }
    }

    //get one listing
    public KiteDTO.SingleResponse getListing(String externalId){
        try{
            return restClient.get().uri("/listings/" + externalId).retrieve().body(KiteDTO.SingleResponse.class);
        }catch (HttpClientErrorException e){
            throw new ApiException(getErrorMessage(e.getStatusCode().value()));
        }catch (RestClientException e){
            throw new ApiException("Kite is unavailable right now");
        }
    }

    private String addFilters(String url, String propertyType, Integer minPrice, Integer maxPrice){
        if(propertyType != null){
            url += "&property_type=" + propertyType;
        }
        if(minPrice != null){
            url += "&price_min=" + minPrice;
        }
        if(maxPrice != null){
            url += "&price_max=" + maxPrice;
        }
        return url;
    }

    private String getErrorMessage(int status){
        if(status == 400){
            return "Invalid search filters";
        }
        if(status == 401 || status == 403){
            return "Kite API key is invalid";
        }
        if(status == 404){
            return "Property not found or no longer listed";
        }
        if(status == 429){
            return "Too many requests to Kite, try again later";
        }
        return "Kite returned an unexpected error";
    }

    //cheapest listing in the whole market
    public KiteDTO.ListResponse getCheapestListing(String city, String listingType, String propertyType, Integer maxPrice){
        String url = "/listings?city=" + city + "&listing_type=" + listingType + "&sort=price_asc&limit=1";
        url = addFilters(url, propertyType, null, maxPrice);
        try{
            return restClient.get().uri(url).retrieve().body(KiteDTO.ListResponse.class);
        }catch (HttpClientErrorException e){
            throw new ApiException(getErrorMessage(e.getStatusCode().value()));
        }catch (RestClientException e){
            throw new ApiException("Kite is unavailable right now");
        }
    }

    //neighborhoods of a city
    public KiteDTO.NeighborhoodsResponse getNeighborhoods(String city){
        try{
            return restClient.get().uri("/cities/" + city + "/neighborhoods").retrieve().body(KiteDTO.NeighborhoodsResponse.class);
        }catch (HttpClientErrorException e){
            throw new ApiException(getErrorMessage(e.getStatusCode().value()));
        }catch (RestClientException e){
            throw new ApiException("Kite is unavailable right now");
        }
    }

    //count listings inside one neighborhood
    public KiteDTO.CountResponse countInNeighborhood(String city, String listingType, String propertyType, Integer maxPrice, Integer neighborhoodId){
        String url = "/listings/count?city=" + city + "&listing_type=" + listingType + "&neighborhood_id=" + neighborhoodId;
        url = addFilters(url, propertyType, null, maxPrice);
        try{
            return restClient.get().uri(url).retrieve().body(KiteDTO.CountResponse.class);
        }catch (HttpClientErrorException e){
            throw new ApiException(getErrorMessage(e.getStatusCode().value()));
        }catch (RestClientException e){
            throw new ApiException("Kite is unavailable right now");
        }
    }

    //search listings inside one neighborhood
    public KiteDTO.ListResponse searchInNeighborhood(String city, String listingType, String propertyType, Integer maxPrice, Integer neighborhoodId){
        String url = "/listings?city=" + city + "&listing_type=" + listingType + "&limit=20&neighborhood_id=" + neighborhoodId;
        url = addFilters(url, propertyType, null, maxPrice);
        try{
            return restClient.get().uri(url).retrieve().body(KiteDTO.ListResponse.class);
        }catch (HttpClientErrorException e){
            throw new ApiException(getErrorMessage(e.getStatusCode().value()));
        }catch (RestClientException e){
            throw new ApiException("Kite is unavailable right now");
        }
    }

    //search with Kite sorting: price_asc, price_desc, newest, price_drop
    public KiteDTO.ListResponse searchSorted(String city, String listingType, String propertyType, Integer maxPrice, String sort, Integer limit){
        String url = "/listings?city=" + city + "&listing_type=" + listingType + "&sort=" + sort + "&limit=" + limit;
        url = addFilters(url, propertyType, null, maxPrice);
        return callListings(url);
    }

    //search inside several neighborhoods (ids separated by comma)
    public KiteDTO.ListResponse searchInNeighborhoods(String city, String listingType, String propertyType, String neighborhoodIds){
        String url = "/listings?city=" + city + "&listing_type=" + listingType + "&limit=20&neighborhood_id=" + neighborhoodIds;
        url = addFilters(url, propertyType, null, null);
        return callListings(url);
    }

    //search inside a box on the map (west,south,east,north)
    public KiteDTO.ListResponse searchInBox(String city, String listingType, String propertyType, String bbox){
        String url = "/listings?city=" + city + "&listing_type=" + listingType + "&limit=20&bbox=" + bbox;
        url = addFilters(url, propertyType, null, null);
        return callListings(url);
    }

    //shared call for listing searches
    private KiteDTO.ListResponse callListings(String url){
        try{
            return restClient.get().uri(url).retrieve().body(KiteDTO.ListResponse.class);
        }catch (HttpClientErrorException e){
            throw new ApiException(getErrorMessage(e.getStatusCode().value()));
        }catch (RestClientException e){
            throw new ApiException("Kite is unavailable right now");
        }
    }
}