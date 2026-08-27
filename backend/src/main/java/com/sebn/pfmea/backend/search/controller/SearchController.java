package com.sebn.pfmea.backend.search.controller;

import com.sebn.pfmea.backend.search.dto.request.SearchRequest;
import com.sebn.pfmea.backend.search.dto.response.SearchResponse;
import com.sebn.pfmea.backend.search.service.SearchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ModelAttribute;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    public SearchResponse search(
            @Valid @ModelAttribute SearchRequest request
    ) {
        return searchService.search(request);
    }
}
