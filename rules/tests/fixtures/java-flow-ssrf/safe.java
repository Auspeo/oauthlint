package com.example.ssrf;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import javax.servlet.http.HttpServletRequest;
import java.net.URI;
import java.util.Set;

@RestController
class SafeSsrfController {
    private final RestTemplate restTemplate = new RestTemplate();
    private static final Set<String> ALLOWED_HOSTS =
            Set.of("api.internal.example.com", "images.example.com");
    private static final Set<String> ALLOWED_URLS =
            Set.of("https://api.internal.example.com/health");

    // Allow-list / host-validation helper that vets the URL and RETURNS the
    // vetted value (or a safe default), clearing the taint at the call site.
    private String validateUrl(String raw) {
        return ALLOWED_HOSTS.contains(URI.create(raw).getHost())
                ? raw
                : "https://api.internal.example.com/health";
    }

    // Safe: a hard-coded constant target — no untrusted input reaches the sink.
    @GetMapping("/health")
    String health() {
        // ok: auth.java.flow.ssrf
        return restTemplate.getForObject("https://api.internal.example.com/health", String.class);
    }

    // Safe: the request value is passed through a host allow-list validator that
    // returns the vetted destination before it reaches the request.
    @GetMapping("/fetch")
    String fetch(@RequestParam String url) {
        String dest = validateUrl(url);
        // ok: auth.java.flow.ssrf
        return restTemplate.getForObject(dest, String.class);
    }

    // Safe: the raw request value is only requested inside an explicit
    // allow-list membership guard, so it is validated before use.
    @GetMapping("/guarded")
    String guarded(HttpServletRequest req) {
        String raw = req.getParameter("url");
        if (ALLOWED_URLS.contains(raw)) {
            // ok: auth.java.flow.ssrf
            return restTemplate.getForObject(raw, String.class);
        }
        return "rejected";
    }
}
