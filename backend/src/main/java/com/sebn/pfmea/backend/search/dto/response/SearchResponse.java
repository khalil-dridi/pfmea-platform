package com.sebn.pfmea.backend.search.dto.response;

import java.util.List;

public record SearchResponse(

        List<SearchResultResponse> content,

        int page,

        int size,

        long totalElements,

        int totalPages
) {
}
