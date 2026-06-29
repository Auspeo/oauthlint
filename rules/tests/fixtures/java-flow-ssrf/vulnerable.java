package com.example.ssrf;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpEntity;
import javax.servlet.http.HttpServletRequest;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import org.apache.http.client.methods.HttpGet;
import java.net.URL;

@RestController
class SsrfController {
    private final RestTemplate restTemplate = new RestTemplate();
    private final OkHttpClient http = new OkHttpClient();

    // @RequestParam flows straight into RestTemplate.getForObject.
    @GetMapping("/fetch")
    String fetch(@RequestParam String url) {
        // ruleid: auth.java.flow.ssrf
        return restTemplate.getForObject(url, String.class);
    }

    // @RequestBody flows into RestTemplate.exchange (indirection through a local).
    @PostMapping("/proxy")
    String proxy(@RequestBody String target) {
        String dest = target;
        // ruleid: auth.java.flow.ssrf
        return restTemplate.exchange(dest, HttpMethod.GET, HttpEntity.EMPTY, String.class).getBody();
    }

    // HttpServletRequest.getParameter feeding a new URL (JDK), then opened.
    @GetMapping("/open")
    String open(HttpServletRequest req) throws Exception {
        String u = req.getParameter("u");
        // ruleid: auth.java.flow.ssrf
        URL parsed = new URL(u);
        return parsed.openConnection().getContentType();
    }

    // Servlet header value into an OkHttp Request.Builder.url(...).
    @GetMapping("/okhttp")
    String okhttp(HttpServletRequest req) throws Exception {
        String upstream = req.getHeader("X-Upstream");
        // ruleid: auth.java.flow.ssrf
        Request request = new Request.Builder().url(upstream).build();
        return http.newCall(request).execute().body().string();
    }

    // @RequestParam into Apache HttpClient HttpGet.
    @GetMapping("/apache")
    HttpGet apache(@RequestParam("endpoint") String endpoint) {
        // ruleid: auth.java.flow.ssrf
        return new HttpGet(endpoint);
    }
}
