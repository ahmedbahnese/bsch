package com.bsch.clinics;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Menu;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String PREFS = "bsch";
    private static final String URL_KEY = "server_url";
    private WebView webView;
    private SharedPreferences prefs;
    @Override public void onCreate(Bundle state) { super.onCreate(state); prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE); buildView(); loadConfiguredServer(); }
    private void buildView() { webView = new WebView(this); webView.setBackgroundColor(Color.rgb(245, 248, 251)); WebSettings settings = webView.getSettings(); settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true); settings.setAllowFileAccess(false); settings.setAllowContentAccess(false); webView.setWebChromeClient(new WebChromeClient()); webView.setWebViewClient(new WebViewClient() { @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { Uri u = request.getUrl(); return !(u.getScheme().equals("http") || u.getScheme().equals("https")); } }); setContentView(webView); }
    private void loadConfiguredServer() { String url = prefs.getString(URL_KEY, ""); if (url.isEmpty()) showServerDialog(); else webView.loadUrl(normalize(url)); }
    private String normalize(String value) { value = value.trim(); if (!value.startsWith("http://") && !value.startsWith("https://")) value = "http://" + value; return value.endsWith("/") ? value : value + "/"; }
    private void showServerDialog() { final EditText input = new EditText(this); input.setSingleLine(true); input.setHint("مثال: http://192.168.1.10:4173"); input.setText(prefs.getString(URL_KEY, "")); LinearLayout box = new LinearLayout(this); box.setPadding(36, 8, 36, 0); box.addView(input, new LinearLayout.LayoutParams(-1, -2)); new AlertDialog.Builder(this).setTitle("إعداد BSCH Clinics").setMessage("اكتب عنوان جهاز الخادم داخل الشبكة المحلية. لا يحتاج التطبيق إلى إنترنت.").setView(box).setCancelable(false).setPositiveButton("فتح النظام", (dialog, which) -> { String value = input.getText().toString().trim(); if (value.isEmpty()) { Toast.makeText(this, "اكتب عنوان الخادم أولاً", Toast.LENGTH_LONG).show(); showServerDialog(); return; } prefs.edit().putString(URL_KEY, normalize(value)).apply(); webView.loadUrl(normalize(value)); }).setNegativeButton("إلغاء", (dialog, which) -> finish()).show(); }
    @Override public boolean onCreateOptionsMenu(Menu menu) { menu.add("تغيير عنوان الخادم").setOnMenuItemClickListener(item -> { showServerDialog(); return true; }); return true; }
    @Override public void onBackPressed() { if (webView.canGoBack()) webView.goBack(); else super.onBackPressed(); }
}
