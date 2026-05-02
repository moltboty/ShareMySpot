package com.sharemyspot;

import android.Manifest;
import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.*;
import android.graphics.drawable.*;
import android.location.*;
import android.net.*;
import android.provider.Settings;
import android.text.*;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;
import android.webkit.*;
import android.annotation.SuppressLint;

import androidx.core.app.ActivityCompat;
import androidx.core.content.FileProvider;

import org.json.*;

import java.io.*;
import java.util.*;

public class MainActivity extends Activity {
    int green = Color.rgb(94,197,186), teal = Color.rgb(44,62,69), bg = Color.rgb(248,250,249);
    int mint = Color.rgb(126,209,198), mintDeep = Color.rgb(75,181,169), mutedBlue = Color.rgb(93,123,214), nearBlack = Color.rgb(38,48,54), softText = Color.rgb(108,119,125), cardBg = Color.WHITE, inputBg = Color.rgb(244,248,247), line = Color.rgb(232,238,236), mintSoft = Color.rgb(235,248,246), softRed = Color.rgb(204,91,91);
    LinearLayout root, tabBar, page; boolean ar=false, dark=false; int activeTab=0; ArrayList<Card> cards=new ArrayList<>();
    EditText nameEt, searchEt, doorEt, phoneEt; TextView coordTxt, pickerCoordTxt; LinearLayout photoRow; ArrayList<Uri> tempPhotos=new ArrayList<>(); double selLat=24.7136, selLng=46.6753, pickerLat=24.7136, pickerLng=46.6753; String selAddress="Riyadh"; WebView pickerWeb; boolean gpsForPicker=false;
    static final int PICK=77, REQ_LOC=88;

    static class Card { String id,name,door,address; double lat,lng; ArrayList<String> photos=new ArrayList<>(); }

    public void onCreate(Bundle b){ super.onCreate(b); dark=getPreferences(0).getBoolean("dark",false); load(); render(); }

    TextView tv(String s,int sp,int color,int style){ TextView v=new TextView(this); v.setText(s); v.setTextSize(sp); v.setTextColor(color); v.setTypeface(Typeface.create("sans-serif",style)); v.setIncludeFontPadding(true); v.setLineSpacing(dp(2),1.08f); v.setPadding(dp(2),dp(3),dp(2),dp(3)); return v; }
    EditText et(String hint){ EditText e=new EditText(this); e.setHint(hint); e.setHintTextColor(Color.rgb(158,166,170)); e.setTextColor(nearBlack); e.setTextSize(17); e.setTypeface(Typeface.create("sans-serif",Typeface.NORMAL)); e.setSingleLine(false); e.setBackground(round(inputBg, dp(18), inputBg)); e.setPadding(dp(18),dp(13),dp(18),dp(13)); e.setMinHeight(dp(62)); return e; }
    Button btn(String s,int color){ Button b=new Button(this); b.setText(s); b.setTextColor(Color.WHITE); b.setTextSize(16); b.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL)); b.setAllCaps(false); b.setBackground(round(color, dp(18), color)); b.setMinHeight(dp(56)); b.setPadding(dp(16),dp(9),dp(16),dp(9)); touchScale(b); return b; }
    Button softBtn(String s,int bgc,int textc){ Button b=btn(s,bgc); b.setTextColor(textc); b.setBackground(round(bgc,dp(18),bgc)); return b; }
    Button textBtn(String s,int textc){ Button b=softBtn(s,Color.TRANSPARENT,textc); b.setMinHeight(dp(44)); return b; }
    GradientDrawable round(int color,int r,int stroke){ GradientDrawable g=new GradientDrawable(); g.setColor(color); g.setCornerRadius(r); if(stroke!=color && color!=Color.TRANSPARENT) g.setStroke(dp(1), stroke); return g; }
    int dp(int v){ return (int)(v*getResources().getDisplayMetrics().density+.5f); }
    void add(ViewGroup p, View v){ LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2); lp.setMargins(0,0,0,dp(12)); p.addView(v,lp); }
    void elevate(View v,int e){ if(Build.VERSION.SDK_INT>=21){ v.setElevation(dp(e)); v.setTranslationZ(dp(1)); } }
    void touchScale(View v){ v.setOnTouchListener((x,e)->{ if(e.getAction()==android.view.MotionEvent.ACTION_DOWN) x.animate().scaleX(.98f).scaleY(.98f).setDuration(90).start(); if(e.getAction()==android.view.MotionEvent.ACTION_UP||e.getAction()==android.view.MotionEvent.ACTION_CANCEL) x.animate().scaleX(1f).scaleY(1f).setDuration(120).start(); return false; }); }
    TextView hero(String title,String sub){ TextView v=tv(title+"\n"+sub,25,nearBlack,Typeface.BOLD); v.setTextAlignment(View.TEXT_ALIGNMENT_CENTER); v.setPadding(dp(18),dp(22),dp(18),dp(22)); v.setBackground(round(cardBg,dp(24),cardBg)); elevate(v,2); return v; }
    LinearLayout panel(){ LinearLayout x=new LinearLayout(this); x.setOrientation(LinearLayout.VERTICAL); x.setPadding(dp(18),dp(18),dp(18),dp(18)); x.setBackground(round(cardBg,dp(24),cardBg)); elevate(x,2); touchScale(x); return x; }
    void addPanel(ViewGroup p, View v){ LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,-2); lp.setMargins(0,0,0,dp(18)); p.addView(v,lp); }
    void applyTheme(){
        if(dark){ bg=Color.rgb(15,20,22); cardBg=Color.rgb(24,32,36); inputBg=Color.rgb(31,42,47); nearBlack=Color.rgb(234,242,240); softText=Color.rgb(166,181,177); line=Color.rgb(43,56,61); mint=Color.rgb(126,209,198); mintDeep=Color.rgb(91,196,184); mintSoft=Color.rgb(31,54,52); softRed=Color.rgb(232,124,124); teal=nearBlack; }
        else { bg=Color.rgb(248,250,249); cardBg=Color.WHITE; inputBg=Color.rgb(244,248,247); nearBlack=Color.rgb(38,48,54); softText=Color.rgb(108,119,125); line=Color.rgb(232,238,236); mint=Color.rgb(126,209,198); mintDeep=Color.rgb(75,181,169); mintSoft=Color.rgb(235,248,246); softRed=Color.rgb(204,91,91); teal=Color.rgb(44,62,69); }
    }

    Drawable quietGridBackground(){
        int cell=dp(20);
        Bitmap tile=Bitmap.createBitmap(cell,cell,Bitmap.Config.ARGB_8888);
        Canvas c=new Canvas(tile);
        Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
        p.setStyle(Paint.Style.FILL); p.setColor(bg); c.drawRect(0,0,cell,cell,p);
        p.setStyle(Paint.Style.STROKE); p.setStrokeWidth(Math.max(1,dp(1))); p.setColor(dark?Color.argb(18,255,255,255):Color.argb(14,0,0,0));
        c.drawLine(0,0,cell,0,p); c.drawLine(0,0,0,cell,p);
        BitmapDrawable d=new BitmapDrawable(getResources(),tile); d.setTileModeX(Shader.TileMode.REPEAT); d.setTileModeY(Shader.TileMode.REPEAT);
        return d;
    }

    void render(){
        applyTheme();
        root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackground(quietGridBackground()); setContentView(root);
        LinearLayout header=new LinearLayout(this); header.setPadding(dp(20),dp(20),dp(20),dp(10)); header.setGravity(Gravity.CENTER_VERTICAL); header.setOrientation(LinearLayout.HORIZONTAL);
        TextView title=tv(ar?"شارك موقعي":"ShareMySpot",27,nearBlack,Typeface.BOLD); header.addView(title,new LinearLayout.LayoutParams(0,-2,1));
        Button lang=softBtn(ar?"E":"ع",cardBg,nearBlack); lang.setTextSize(18); lang.setOnClickListener(v->{ar=!ar; render();}); header.addView(lang,new LinearLayout.LayoutParams(dp(52),dp(44)));
        Button theme=softBtn(dark?"☀":"☾",cardBg,nearBlack); theme.setTextSize(18); theme.setOnClickListener(v->{dark=!dark; getPreferences(0).edit().putBoolean("dark",dark).apply(); render();}); LinearLayout.LayoutParams thp=new LinearLayout.LayoutParams(dp(52),dp(44)); thp.setMargins(dp(8),0,0,0); header.addView(theme,thp);
        root.addView(header);
        tabBar=new LinearLayout(this); tabBar.setPadding(dp(6),dp(6),dp(6),dp(6)); tabBar.setOrientation(LinearLayout.HORIZONTAL); tabBar.setBackground(round(cardBg,dp(24),cardBg)); LinearLayout.LayoutParams tbp=new LinearLayout.LayoutParams(-1,dp(64)); tbp.setMargins(dp(16),0,dp(16),dp(14)); root.addView(tabBar,tbp); elevate(tabBar,2);
        Button t1=softBtn(ar?"إنشاء البطاقة":"Create/Edit", activeTab==0?mint:Color.TRANSPARENT, activeTab==0?Color.WHITE:softText); Button t2=softBtn(ar?"البطاقات":"Cards", activeTab==1?mint:Color.TRANSPARENT, activeTab==1?Color.WHITE:softText);
        t1.setOnClickListener(v->{activeTab=0; render();}); t2.setOnClickListener(v->{activeTab=1; render();}); tabBar.addView(t1,new LinearLayout.LayoutParams(0,dp(52),1)); tabBar.addView(t2,new LinearLayout.LayoutParams(0,dp(52),1));
        ScrollView sv=new ScrollView(this); page=new LinearLayout(this); page.setOrientation(LinearLayout.VERTICAL); page.setPadding(dp(18),dp(8),dp(18),dp(44)); sv.addView(page); root.addView(sv,new LinearLayout.LayoutParams(-1,0,1));
        if(activeTab==0) renderCreate(); else renderCards();
    }

    void renderCreate(){
        add(page,hero(ar?"أنشئ بطاقة موقعك":"Create your location card", ar?"٤ خطوات واضحة وجاهزة للواتساب":"4 clear steps, ready for WhatsApp"));

        add(page,stepTitle(1, ar?"اسم البطاقة":"Card title"));
        nameEt=et(ar?"مثال: البيت / العمل":"Example: Home / Work"); add(page,nameEt);

        add(page,stepTitle(2, ar?"الموقع":"Location"));
        Button locBtn=btn(ar?"افتح الخريطة / حدد موقعي":"Find my location / Pick on map",mintDeep); locBtn.setOnClickListener(v->openLocationPickerDialog()); add(page,locBtn);
        coordTxt=tv(ar?"لم يتم اختيار الموقع بعد":"No location picked yet",14,softText,Typeface.NORMAL); add(page,coordTxt);

        add(page,stepTitle(3, ar?"تفاصيل الباب / البيت":"Door / home details"));
        doorEt=et(ar?"مثال: فيلا 12، الدور الثاني":"Example: Villa 12, second floor"); add(page,doorEt);

        add(page,stepTitle(4, ar?"الصور":"Photos"));
        add(page,tv(ar?"اضغط الزر الأخضر لاختيار صور الباب/البيت من المعرض.":"Tap the green button to choose door/home photos from Gallery.",14,softText,Typeface.NORMAL));
        Button pick=softBtn(ar?"اختر الصور من المعرض":"Choose photos from Gallery",mintSoft,mintDeep); pick.setOnClickListener(v->pickPhotos()); add(page,pick);
        photoRow=new LinearLayout(this); photoRow.setOrientation(LinearLayout.HORIZONTAL); photoRow.setPadding(0,dp(8),0,dp(8)); add(page,photoRow); refreshTempPhotos();

        Button save=btn(ar?"حفظ البطاقة":"Save card",mintDeep); save.setOnClickListener(v->saveCard()); add(page,save);
    }
    TextView label(String s){ TextView l=tv(s,14,nearBlack,Typeface.BOLD); l.setPadding(0,dp(18),0,dp(6)); return l; }
    LinearLayout stepTitle(int n,String title){
        LinearLayout row=new LinearLayout(this); row.setOrientation(LinearLayout.HORIZONTAL); row.setGravity(Gravity.CENTER_VERTICAL); row.setPadding(0,dp(18),0,dp(6));
        TextView num=tv(String.valueOf(n),18,Color.rgb(232,64,64),Typeface.BOLD); num.setGravity(Gravity.CENTER); num.setBackground(round(Color.TRANSPARENT,dp(999),Color.rgb(232,64,64)));
        LinearLayout.LayoutParams np=new LinearLayout.LayoutParams(dp(34),dp(34)); np.setMargins(0,0,dp(10),0); row.addView(num,np);
        TextView t=tv(title,15,nearBlack,Typeface.BOLD); row.addView(t,new LinearLayout.LayoutParams(0,-2,1));
        return row;
    }

    void renderCards(){
        add(page,hero(ar?"البطاقات المحفوظة":"Saved cards", ar?"اختر بطاقة ثم أرسلها لأي رقم واتساب":"Choose a card and send it to any WhatsApp number"));
        if(cards.isEmpty()){ add(page,tv(ar?"لا توجد بطاقات بعد":"No cards yet",16,Color.GRAY,Typeface.NORMAL)); return; }
        for(Card c: cards) addCardView(c);
    }

    void addCardView(Card c){
        LinearLayout box=panel();
        LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-1,-2); bp.setMargins(0,0,0,dp(20)); page.addView(box,bp);

        LinearLayout top=new LinearLayout(this); top.setOrientation(LinearLayout.HORIZONTAL); top.setGravity(Gravity.CENTER_VERTICAL);
        TextView name=tv("⌂  "+c.name,24,nearBlack,Typeface.BOLD); top.addView(name,new LinearLayout.LayoutParams(0,-2,1));
        TextView badge=tv(ar?"بطاقة":"Card",12,mintDeep,Typeface.BOLD); badge.setTextAlignment(View.TEXT_ALIGNMENT_CENTER); badge.setBackground(round(mintSoft,dp(999),mintSoft)); badge.setPadding(dp(12),dp(6),dp(12),dp(6)); top.addView(badge,new LinearLayout.LayoutParams(-2,-2));
        add(box,top);

        TextView loc=tv("📍  https://maps.google.com/?q="+c.lat+","+c.lng,14,softText,Typeface.NORMAL); loc.setBackground(round(inputBg,dp(18),inputBg)); loc.setPadding(dp(14),dp(12),dp(14),dp(12)); add(box,loc);
        if(c.door.length()>0){ TextView door=tv("🚪  "+c.door,15,nearBlack,Typeface.NORMAL); door.setBackground(round(inputBg,dp(18),inputBg)); door.setPadding(dp(14),dp(10),dp(14),dp(10)); add(box,door); }

        LinearLayout imgs=new LinearLayout(this); imgs.setOrientation(LinearLayout.HORIZONTAL); imgs.setPadding(0,dp(2),0,dp(2)); box.addView(imgs,new LinearLayout.LayoutParams(-1,dp(c.photos.isEmpty()?1:128)));
        for(String p:c.photos){ ImageView iv=new ImageView(this); iv.setScaleType(ImageView.ScaleType.CENTER_CROP); iv.setImageURI(Uri.parse(p)); if(Build.VERSION.SDK_INT>=21) iv.setClipToOutline(true); iv.setBackground(round(inputBg,dp(18),inputBg)); LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,-1,1); lp.setMargins(dp(4),dp(8),dp(4),dp(8)); imgs.addView(iv,lp); }

        Button mapBtn=btn(ar?"افتح الموقع في الخرائط":"Open in Maps",mintDeep); mapBtn.setOnClickListener(v->openMap(c.lat,c.lng,c.name)); add(box,mapBtn);

        add(box,label(ar?"أدخل رقم واتساب":"Add any WhatsApp number"));
        EditText phone=et(ar?"مثال: 05xxxxxxxx أو +9665xxxxxxxx":"Example: 05xxxxxxxx or +9665xxxxxxxx"); phone.setInputType(android.text.InputType.TYPE_CLASS_PHONE); phone.setSingleLine(true); phone.setTextSize(19); phone.setMinHeight(dp(70)); phone.setPadding(dp(18),dp(14),dp(18),dp(14)); add(box,phone);
        Button open=softBtn(ar?"إرسال عبر واتساب":"Send via WhatsApp",mintSoft,mintDeep); open.setOnClickListener(v->shareToNumber(c,phone.getText().toString())); add(box,open);
        Button del=textBtn(ar?"حذف البطاقة":"Delete",softRed); del.setOnClickListener(v->{cards.remove(c); persist(); render();}); add(box,del);
    }

    void findLocation(){
        String q=searchEt.getText().toString().trim(); if(q.isEmpty()){toast(ar?"الصق رابط الخريطة أو اكتب عنوان":"Paste a map link or type address"); return;}
        if(applyCoordsFromText(q)){ toast(ar?"تم أخذ الإحداثيات من الرابط":"Coordinates loaded from link"); return; }
        new Thread(()->{ try{ Geocoder g=new Geocoder(this, Locale.getDefault()); java.util.List<Address> res=g.getFromLocationName(q,1); runOnUiThread(()->{ if(res!=null&&!res.isEmpty()){ Address a=res.get(0); setSelectedLocation(a.getLatitude(),a.getLongitude(),a.getAddressLine(0)); } else toast(ar?"لم يتم العثور - استخدم GPS أو افتح Google Maps":"Not found - use GPS or open Google Maps"); }); }catch(Exception e){ runOnUiThread(()->toast(ar?"فشل البحث - استخدم GPS":"Search failed - use GPS")); }}).start();
    }
    boolean applyCoordsFromText(String text){
        java.util.regex.Matcher m=java.util.regex.Pattern.compile("(-?\\d{1,3}\\.\\d+)\\s*,\\s*(-?\\d{1,3}\\.\\d+)").matcher(text);
        if(m.find()){ try{ setSelectedLocation(Double.parseDouble(m.group(1)),Double.parseDouble(m.group(2)),"Google Maps link"); return true; }catch(Exception e){} }
        return false;
    }
    void setSelectedLocation(double lat,double lng,String address){ selLat=lat; selLng=lng; selAddress=address==null?"Selected location":address; if(coordTxt!=null) coordTxt.setText("✅ "+selAddress+"\n"+selLat+", "+selLng); }
    void useCurrentGps(){
        if(Build.VERSION.SDK_INT>=23 && checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)!=PackageManager.PERMISSION_GRANTED){ requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION},REQ_LOC); return; }
        try{
            LocationManager lm=(LocationManager)getSystemService(LOCATION_SERVICE); Location best=null;
            for(String p:lm.getProviders(true)){ Location l=lm.getLastKnownLocation(p); if(l!=null && (best==null || l.getAccuracy()<best.getAccuracy())) best=l; }
            if(best!=null){
                if(gpsForPicker){ pickerLat=best.getLatitude(); pickerLng=best.getLongitude(); gpsForPicker=false; if(pickerCoordTxt!=null) pickerCoordTxt.setText("✅ "+pickerLat+", "+pickerLng); if(pickerWeb!=null) pickerWeb.evaluateJavascript("window.centerOn("+pickerLat+","+pickerLng+")",null); toast(ar?"تم تحديد موقعك الحالي":"Current location found"); }
                else { setSelectedLocation(best.getLatitude(),best.getLongitude(),"GPS current location"); toast(ar?"تم أخذ موقعك الحالي":"Current GPS location saved"); }
            }
            else { gpsForPicker=false; toast(ar?"لم أجد GPS. شغل الموقع وحاول مرة أخرى":"No GPS yet. Enable location and try again"); startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS)); }
        }catch(Exception e){ toast(ar?"تعذر أخذ GPS":"Could not get GPS"); }
    }
    public void onRequestPermissionsResult(int r,String[] p,int[] g){ super.onRequestPermissionsResult(r,p,g); if(r==REQ_LOC && g.length>0 && g[0]==PackageManager.PERMISSION_GRANTED) useCurrentGps(); }


    @SuppressLint({"SetJavaScriptEnabled","AddJavascriptInterface"})
    void openLocationPickerDialog(){
        Dialog d=new Dialog(this);
        LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(dp(18),dp(18),dp(18),dp(18)); box.setBackgroundColor(bg);
        add(box,tv(ar?"حدد موقع البيت":"Pick home location",24,nearBlack,Typeface.BOLD));
        add(box,tv(ar?"اضغط موقعي الحالي أو حرّك الخريطة، ثم اضغط حفظ الموقع.":"Tap Current location or move the map, then tap Save location.",14,softText,Typeface.NORMAL));
        Button gps=softBtn(ar?"موقعي الحالي":"Use my current location",mintSoft,mintDeep); gps.setOnClickListener(v->useCurrentGpsInPicker()); add(box,gps);
        pickerLat=selLat; pickerLng=selLng;
        addDialogMapPicker(box);
        pickerCoordTxt=tv("✅ "+pickerLat+", "+pickerLng,14,softText,Typeface.BOLD); add(box,pickerCoordTxt);
        Button save=btn(ar?"حفظ الموقع والرجوع":"Save location and go back",mintDeep); save.setOnClickListener(v->{ setSelectedLocation(pickerLat,pickerLng,"Map pin location"); d.dismiss(); }); add(box,save);
        Button cancel=textBtn(ar?"إلغاء":"Cancel",softText); cancel.setOnClickListener(v->d.dismiss()); add(box,cancel);
        d.setContentView(box);
        Window w=d.getWindow();
        d.setOnShowListener(x->{ Window win=d.getWindow(); if(win!=null) win.setLayout(WindowManager.LayoutParams.MATCH_PARENT,WindowManager.LayoutParams.MATCH_PARENT); });
        d.show();
    }

    @SuppressLint({"SetJavaScriptEnabled","AddJavascriptInterface"})
    void addDialogMapPicker(ViewGroup parent){
        FrameLayout frame=new FrameLayout(this);
        frame.setBackground(round(cardBg,dp(24),cardBg)); elevate(frame,2);
        pickerWeb=new WebView(this);
        pickerWeb.getSettings().setJavaScriptEnabled(true);
        pickerWeb.getSettings().setDomStorageEnabled(true);
        pickerWeb.getSettings().setUserAgentString("ShareMySpot/1.0 Android map picker contact: app-user");
        pickerWeb.setOnTouchListener((v,e)->{ v.getParent().requestDisallowInterceptTouchEvent(true); return false; });
        final double startLat=pickerLat, startLng=pickerLng;
        class Bridge { @JavascriptInterface public void setLocation(String lat,String lng){ try{ double la=Double.parseDouble(lat), ln=Double.parseDouble(lng); runOnUiThread(()->{ pickerLat=la; pickerLng=ln; if(pickerCoordTxt!=null) pickerCoordTxt.setText("✅ "+pickerLat+", "+pickerLng); }); }catch(Exception e){} } }
        pickerWeb.addJavascriptInterface(new Bridge(),"Android");
        String html=""+
        "<!doctype html><html><head><meta name='viewport' content='width=device-width,initial-scale=1'>"+
        "<link rel='stylesheet' href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'>"+
        "<script src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'></script>"+
        "<style>html,body,#map{height:100%;margin:0;background:#eef}.pin{position:absolute;left:50%;top:50%;transform:translate(-50%,-100%);font-size:46px;z-index:999;pointer-events:none;text-shadow:0 2px 4px white}.hint{position:absolute;left:10px;right:10px;top:10px;z-index:999;background:white;border-radius:14px;padding:8px;text-align:center;font:bold 14px sans-serif;box-shadow:0 2px 8px #777}</style>"+
        "</head><body><div id='map'></div><div class='hint'>"+(ar?"حرّك الخريطة وضع الدبوس على البيت":"Move map and place pin on home")+"</div><div class='pin'>📍</div>"+
        "<script>var map=L.map('map',{zoomControl:true}).setView(["+startLat+","+startLng+"],17);L.tileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',{maxZoom:20,attribution:'© OpenStreetMap © CARTO'}).addTo(map);function send(){var c=map.getCenter();Android.setLocation(String(c.lat),String(c.lng));}window.centerOn=function(a,b){map.setView([a,b],18);send();};map.on('moveend',send);setTimeout(send,500);</script>"+
        "</body></html>";
        pickerWeb.loadDataWithBaseURL("https://openstreetmap.org/",html,"text/html","UTF-8",null);
        frame.addView(pickerWeb,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(-1,0,1); lp.setMargins(0,dp(8),0,dp(8));
        parent.addView(frame,lp);
    }

    void useCurrentGpsInPicker(){ gpsForPicker=true; useCurrentGps(); }

    void openSelectedMap(){ String q=searchEt==null?"":searchEt.getText().toString().trim(); if(q.length()>0 && !applyCoordsFromText(q)) openMapSearch(q); else openMap(selLat,selLng,"ShareMySpot"); }
    void openMapSearch(String q){ try{ startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("geo:0,0?q="+Uri.encode(q))).setPackage("com.google.android.apps.maps")); }catch(Exception e){ startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("https://www.google.com/maps/search/?api=1&query="+Uri.encode(q)))); } }
    void openMap(double lat,double lng,String label){ Uri u=Uri.parse("geo:"+lat+","+lng+"?q="+lat+","+lng+"("+Uri.encode(label)+")"); try{ startActivity(new Intent(Intent.ACTION_VIEW,u).setPackage("com.google.android.apps.maps")); }catch(Exception e){ startActivity(new Intent(Intent.ACTION_VIEW,Uri.parse("https://maps.google.com/?q="+lat+","+lng))); } }
    void pickPhotos(){ try{ Intent i=new Intent(Intent.ACTION_GET_CONTENT); i.setType("image/*"); i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true); i.addCategory(Intent.CATEGORY_OPENABLE); startActivityForResult(Intent.createChooser(i,ar?"اختر صور البيت":"Choose home photos"),PICK); }catch(Exception e){ toast(ar?"لم أجد معرض الصور":"Gallery app not found"); } }
    protected void onActivityResult(int r,int c,Intent d){ super.onActivityResult(r,c,d); if(r==PICK&&c==RESULT_OK&&d!=null){ tempPhotos.clear(); if(d.getClipData()!=null){ for(int i=0;i<Math.min(2,d.getClipData().getItemCount());i++) tempPhotos.add(d.getClipData().getItemAt(i).getUri()); } else if(d.getData()!=null) tempPhotos.add(d.getData()); refreshTempPhotos(); toast((ar?"تمت إضافة الصور: ":"Photos added: ")+tempPhotos.size()); } }
    void refreshTempPhotos(){ if(photoRow==null)return; photoRow.removeAllViews(); if(tempPhotos.isEmpty()){ add(photoRow,tv(ar?"لا توجد صور مختارة بعد":"No photos selected yet",14,Color.GRAY,Typeface.NORMAL)); return; } for(Uri u:tempPhotos){ ImageView iv=new ImageView(this); iv.setImageURI(u); iv.setScaleType(ImageView.ScaleType.CENTER_CROP); LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(120),1); lp.setMargins(dp(4),dp(4),dp(4),dp(4)); photoRow.addView(iv,lp);} }
    void saveCard(){ String n=nameEt.getText().toString().trim(); if(n.isEmpty()){toast(ar?"اكتب اسم البطاقة":"Add card title"); return;} Card c=new Card(); c.id="c"+System.currentTimeMillis(); c.name=n; c.door=doorEt.getText().toString().trim(); c.lat=selLat; c.lng=selLng; c.address=selAddress; for(Uri u:tempPhotos) c.photos.add(copyToFiles(u,c.id)); cards.add(c); persist(); tempPhotos.clear(); activeTab=1; render(); }
    String copyToFiles(Uri uri){ return copyToFiles(uri,"img"); } String copyToFiles(Uri uri,String prefix){ try{ File f=new File(getFilesDir(),prefix+"_"+System.nanoTime()+".jpg"); InputStream in=getContentResolver().openInputStream(uri); FileOutputStream out=new FileOutputStream(f); byte[] buf=new byte[8192]; int n; while((n=in.read(buf))>0) out.write(buf,0,n); in.close(); out.close(); return Uri.fromFile(f).toString(); }catch(Exception e){ return uri.toString(); } }

    String normPhone(String p){ String d=p.replaceAll("[^0-9+]",""); if(d.startsWith("+")) d=d.substring(1); if(d.startsWith("00")) d=d.substring(2); if(d.startsWith("0")) d="966"+d.substring(1); return d; }
    String message(Card c){ return (ar?"مرحباً 👋":"Hello 👋")+"\n\n🏠 "+c.name+"\n📍 https://maps.google.com/?q="+c.lat+","+c.lng+(c.door.length()>0?"\n🚪 "+c.door:""); }

    void shareToNumber(Card c,String phoneRaw){
        String phone=normPhone(phoneRaw); if(phone.length()<8){toast(ar?"أدخل رقم واتساب صحيح":"Enter any valid WhatsApp number"); return;}
        try{
            Uri cardImg=makeCardImage(c);
            Intent intent=new Intent(Intent.ACTION_SEND);
            intent.setType("image/png");
            intent.putExtra(Intent.EXTRA_STREAM,cardImg);
            intent.putExtra(Intent.EXTRA_TEXT,message(c));
            intent.putExtra("jid", phone+"@s.whatsapp.net");
            intent.setPackage("com.whatsapp");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.setClipData(ClipData.newUri(getContentResolver(),"ShareMySpot card",cardImg));

            ResolveInfo wa=getBestWhatsAppActivity(intent,"com.whatsapp");
            if(wa==null){
                intent.setPackage("com.whatsapp.w4b");
                wa=getBestWhatsAppActivity(intent,"com.whatsapp.w4b");
            }
            if(wa!=null){
                intent.setComponent(new ComponentName(wa.activityInfo.packageName,wa.activityInfo.name));
                grantUriPermission(wa.activityInfo.packageName,cardImg,Intent.FLAG_GRANT_READ_URI_PERMISSION);
                startActivity(intent);
                return;
            }
            throw new ActivityNotFoundException("WhatsApp not found");
        }catch(Exception e){
            try{
                Intent url=new Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/"+phone+"?text="+Uri.encode(message(c))));
                url.setPackage("com.whatsapp");
                startActivity(url);
                toast(ar?"فتح واتساب بالنص فقط. إذا لم تظهر الصورة استخدم زر المشاركة من البطاقة.":"Opened WhatsApp with text only. If image does not appear, use Android share from the card.");
            }catch(Exception ex){ toast(ar?"واتساب غير مثبت":"WhatsApp not installed"); }
        }
    }
    ResolveInfo getBestWhatsAppActivity(Intent intent,String pkg){
        java.util.List<ResolveInfo> matches=getPackageManager().queryIntentActivities(intent,PackageManager.MATCH_DEFAULT_ONLY);
        for(ResolveInfo r:matches) if(r.activityInfo!=null && pkg.equals(r.activityInfo.packageName) && r.activityInfo.name.toLowerCase(Locale.US).contains("contactpicker")) return r;
        for(ResolveInfo r:matches) if(r.activityInfo!=null && pkg.equals(r.activityInfo.packageName)) return r;
        Intent copy=new Intent(intent); copy.setPackage(null); matches=getPackageManager().queryIntentActivities(copy,PackageManager.MATCH_DEFAULT_ONLY);
        for(ResolveInfo r:matches) if(r.activityInfo!=null && pkg.equals(r.activityInfo.packageName)) return r;
        return null;
    }
    Uri fileProviderUri(Uri u){ if("file".equals(u.getScheme())) return FileProvider.getUriForFile(this,getPackageName()+".fileprovider",new File(u.getPath())); return u; }
    Uri makeCardImage(Card c)throws Exception{ Bitmap bm=Bitmap.createBitmap(1080,1350,Bitmap.Config.ARGB_8888); Canvas cn=new Canvas(bm); Paint p=new Paint(Paint.ANTI_ALIAS_FLAG); p.setColor(bg); cn.drawRect(0,0,1080,1350,p); p.setColor(mintDeep); cn.drawRoundRect(50,50,1030,260,46,46,p); p.setColor(Color.WHITE); p.setTextSize(62); p.setTypeface(Typeface.DEFAULT_BOLD); cn.drawText(c.name,90,145,p); p.setTextSize(34); cn.drawText("ShareMySpot / شارك موقعي",90,210,p); p.setColor(Color.WHITE); cn.drawRoundRect(50,310,1030,560,28,28,p); p.setColor(Color.rgb(20,30,30)); p.setTextSize(38); cn.drawText("📍 https://maps.google.com/?q="+c.lat+","+c.lng,90,390,p); p.setTextSize(40); if(c.door.length()>0) cn.drawText("🚪 "+c.door,90,470,p); int y=610; for(int i=0;i<Math.min(2,c.photos.size());i++){ Bitmap img=BitmapFactory.decodeStream(getContentResolver().openInputStream(Uri.parse(c.photos.get(i)))); if(img!=null){ Rect dst=new Rect(i==0?70:555,y,i==0?525:1010,y+520); cn.drawBitmap(img,null,dst,p); }} File f=new File(getCacheDir(),"sharemyspot_card.png"); FileOutputStream out=new FileOutputStream(f); bm.compress(Bitmap.CompressFormat.PNG,95,out); out.close(); return FileProvider.getUriForFile(this,getPackageName()+".fileprovider",f); }

    void load(){ try{ JSONArray a=new JSONArray(getPreferences(0).getString("cards","[]")); for(int i=0;i<a.length();i++){ JSONObject o=a.getJSONObject(i); Card c=new Card(); c.id=o.getString("id"); c.name=o.getString("name"); c.door=o.optString("door",""); c.address=o.optString("address",""); c.lat=o.optDouble("lat",24.7136); c.lng=o.optDouble("lng",46.6753); JSONArray ps=o.optJSONArray("photos"); if(ps!=null) for(int j=0;j<ps.length();j++) c.photos.add(ps.getString(j)); cards.add(c);} }catch(Exception e){} }
    void persist(){ try{ JSONArray a=new JSONArray(); for(Card c:cards){ JSONObject o=new JSONObject(); o.put("id",c.id);o.put("name",c.name);o.put("door",c.door);o.put("address",c.address);o.put("lat",c.lat);o.put("lng",c.lng); JSONArray ps=new JSONArray(); for(String p:c.photos) ps.put(p); o.put("photos",ps); a.put(o);} getPreferences(0).edit().putString("cards",a.toString()).apply(); }catch(Exception e){} }
    void toast(String s){ Toast.makeText(this,s,Toast.LENGTH_LONG).show(); }
}
