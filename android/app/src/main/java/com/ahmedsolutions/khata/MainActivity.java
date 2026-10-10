package com.ahmedsolutions.khata;
import android.app.Activity;
import android.app.DownloadManager;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.*;
import android.widget.*;
import android.view.View;
import android.view.ViewGroup;
import java.io.OutputStream;

public final class MainActivity extends Activity {
  private WebView web;
  private String server;
  private ValueCallback<Uri[]> fileCallback;
  private byte[] pendingDownload;
  private SharedPreferences preferences;
  @Override public void onCreate(Bundle state) {
    super.onCreate(state);preferences=getSharedPreferences("khata_setup",MODE_PRIVATE);
    server=preferences.getString("server",null);if(server==null)setup();else open(state);
  }
  private int dp(int n){return (int)(n*getResources().getDisplayMetrics().density);}
  private void setup(){
    LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.setPadding(dp(24),dp(48),dp(24),dp(24));
    TextView title=new TextView(this);title.setText("Khata OS\nAhmed Solutions");title.setTextSize(28);layout.addView(title);
    TextView help=new TextView(this);help.setText("Enter your business software link. Connect online once, sign in to your existing account, and wait for Saved to cloud before working offline.");help.setTextSize(16);help.setPadding(0,dp(24),0,dp(16));layout.addView(help);
    EditText address=new EditText(this);address.setHint("https://your-software-domain");address.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_URI);layout.addView(address);
    Button button=new Button(this);button.setText("Open My Software");layout.addView(button);
    button.setOnClickListener(v->{try{Uri uri=Uri.parse(address.getText().toString().trim());if(!"https".equalsIgnoreCase(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null)throw new Exception();server="https://"+uri.getHost()+(uri.getPort()!=-1?":"+uri.getPort():"");preferences.edit().putString("server",server).apply();open(null);}catch(Exception error){address.setError("Enter a valid HTTPS software address");}});
    setContentView(layout);
  }
  private boolean ownOrigin(Uri uri){Uri expected=Uri.parse(server);return "https".equalsIgnoreCase(uri.getScheme())&&expected.getHost().equalsIgnoreCase(uri.getHost()==null?"":uri.getHost())&&expected.getPort()==uri.getPort();}
  private void open(Bundle state){
    web=new WebView(this);WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setDatabaseEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(false);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setBuiltInZoomControls(false);s.setSupportMultipleWindows(false);
    CookieManager.getInstance().setAcceptCookie(true);CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
    web.addJavascriptInterface(new Downloads(),"KhataAndroid");
    web.setWebViewClient(new WebViewClient(){
      @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){Uri uri=request.getUrl();if(ownOrigin(uri))return false;if("https".equals(uri.getScheme())||"http".equals(uri.getScheme())){startActivity(new Intent(Intent.ACTION_VIEW,uri));}return true;}
      @Override public void onPageFinished(WebView view,String url){CookieManager.getInstance().flush();}
    });
    web.setWebChromeClient(new WebChromeClient(){@Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");startActivityForResult(i,10);return true;}});
    web.setDownloadListener((url,agent,disposition,mime,length)->{Uri uri=Uri.parse(url);if(!ownOrigin(uri))return;DownloadManager.Request r=new DownloadManager.Request(uri);String cookies=CookieManager.getInstance().getCookie(url);if(cookies!=null)r.addRequestHeader("Cookie",cookies);r.setMimeType(mime);r.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);String file=URLUtil.guessFileName(url,disposition,mime);r.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS,file);((DownloadManager)getSystemService(DOWNLOAD_SERVICE)).enqueue(r);});
    web.setOnApplyWindowInsetsListener((view,insets)->{view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
    setContentView(web,new ViewGroup.LayoutParams(-1,-1));
    if(state==null||web.restoreState(state)==null)web.loadUrl(server+"/");
  }
  public final class Downloads {
    @JavascriptInterface public void saveFile(String data,String mime,String filename){
      if(data.length()>140000000)return;
      runOnUiThread(()->{
        if(web==null||!ownOrigin(Uri.parse(web.getUrl()==null?"":web.getUrl())))return;
        new Thread(()->{try{byte[] bytes=Base64.decode(data,Base64.NO_WRAP);runOnUiThread(()->{pendingDownload=bytes;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType(mime);i.putExtra(Intent.EXTRA_TITLE,filename.replaceAll("[^A-Za-z0-9._-]","_"));startActivityForResult(i,11);});}catch(Exception error){runOnUiThread(()->Toast.makeText(MainActivity.this,"Unable to save file",Toast.LENGTH_LONG).show());}}).start();
      });
    }
  }
  @Override protected void onActivityResult(int code,int result,Intent data){super.onActivityResult(code,result,data);if(code==10&&fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null?new Uri[]{data.getData()}:null);fileCallback=null;}if(code==11){byte[] bytes=pendingDownload;pendingDownload=null;if(result==RESULT_OK&&data!=null&&bytes!=null){new Thread(()->{try(OutputStream output=getContentResolver().openOutputStream(data.getData())){output.write(bytes);runOnUiThread(()->Toast.makeText(this,"File saved",Toast.LENGTH_SHORT).show());}catch(Exception error){runOnUiThread(()->Toast.makeText(this,"File could not be saved",Toast.LENGTH_LONG).show());}}).start();}}}
  @Override public void onBackPressed(){if(web!=null&&web.canGoBack())web.goBack();else super.onBackPressed();}
  @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);if(web!=null)web.saveState(state);}
  @Override protected void onDestroy(){if(fileCallback!=null)fileCallback.onReceiveValue(null);if(web!=null)web.destroy();super.onDestroy();}
}
