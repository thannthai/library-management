package com.thanh.librarymanagementsystem.payload.response;

import lombok.Data;

import java.util.List;

@Data
public class GoogleBookApiResponse {
    private List<Item> items;

    @Data
    public static class Item {
        VolumeInfo volumeInfo;
    }

    @Data
    public static class VolumeInfo {
        private String title;
        private List<String> authors;
        private String publisher;
        private String publishedDate;
        private String description;
        private List<IndustryIdentifier> industryIdentifiers;
        private Integer pageCount;
        private List<String> categories;
        private String language;
        private ImageLink imageLinks;
    }

    @Data
    public static class IndustryIdentifier {
        private String type;
        private String identifier;
    }

    @Data
    public static class ImageLink {
        private String smallThumbnail;
        private String thumbnail;
    }
}
