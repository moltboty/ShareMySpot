package com.sharemyspot;

import android.Manifest;
import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.graphics.*;
import android.graphics.drawable.*;
import android.location.*;
import android.net.*;
import android.provider.Settings;
import android.text.*;
import android.view.*;
import android.view.inputmethod.InputMethodManager;
import android.widget.*;

import androidx.core.app.ActivityCompat;
import androidx.core.content.FileProvider;

import org.json.*;

import java.io.*;
import java.util.*;

public class MainActivity extends Activity {
    int green = Color.rgb(37,211,102), teal = Color.rgb(7,94,84), bg = Color.rgb(246,248,247);
    LinearLayout root, tabBar, page; boolean ar=false; int activeTab=0; ArrayList<Card> cards=new ArrayList<>();
    EditText nameEt, searchEt, doorEt, phoneEt; TextView coordTxt; LinearLayout photoRow; ArrayList<Uri> tempPhotos=new ArrayList<>(); double selLat=24.7136, selLng=46.6753; String selAddress="Riyadh";
    static final int PICK=77;

    static class Card { String id,name,door,address; double lat,lng; ArrayList<String> photos=new ArrayList<>(); }

    public void onCreate(Bundle b){ super.onCreate(b); load(); render(); }

    TextView tv(String s,int sp,int color,int style){ TextView v=new TextView(this); v.setText(s); v.setTextSize(sp); v.setTextColor(color); v.setTypeface(Typeface.DEFAULT,style); v.setPadding(dp(4),dp(4),dp(4),dp(4)); return v; }
    EditText et(String hint){ EditText e=new EditText(this); e.setHint(hint); e.setTextSize(16); e.setSingleLine(false); e.setBackground(round(Color.WHITE, dp(14), Color.rgb(220,226,223))); e.setPadding(dp(14),0,dp(14),0); e.setMinHeight(dp(52)); return e; }
    Button btn(String s,int color){ Button b=new Button(this); b.setText(s); b.setTextColor(Color.WHITE); b.setTextSize(15); b.setTypeface(Typeface.DEFAULT,Typeface.BOLD); b.setAllCaps(false); b.setBackground(round(color, dp(14), color)); b.setMinHeight(dp(52)); return b; }
    GradientDrawable round(int color,int r,int stroke){ GradientDrawable g=new GradientDrawable(); g.setColor(color); g.setCornerRadius(r); g.setStroke(dp(1), stroke); return g; }
    int dp(int v){ return (int)(v*getResources().getDisplayMetrics().density+.5f); }
    void add(ViewGroup p, View v){ p.addView(v,new LinearLayout.LayoutParams(-1,-2)); }

    void render(){
        root=new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL); root.setBackgroundColor(bg); setContentView(root);
        LinearLayout header=new LinearLayout(this); header.setPadding(dp(16),dp(18),dp(16),dp(8)); header.setGravity(Gravity.CENTER_VERTICAL); header.setOrientation(LinearLayout.HORIZONTAL);
        TextView title=tv(ar?"شارك موقعي":"ShareMySpot",24,teal,Typeface.BOLD); header.addView(title,new LinearLayout.LayoutParams(0,-2,1));
        Button lang=btn(ar?"EN":"عر",teal); lang.setOnClickListener(v->{ar=!ar; render();}); header.addView(lang,new LinearLayout.LayoutParams(dp(72),dp(48)));
        root.addView(header);
        tabBar=new LinearLayout(this); tabBar.setPadding(dp(12),0,dp(12),dp(8)); tabBar.setOrientation(LinearLayout.HORIZONTAL); root.addView(tabBar);
        Button t1=btn(ar?"إنشاء البطاقة":"Create/Edit", activeTab==0?green:teal); Button t2=btn(ar?"البطاقات":"Cards", activeTab==1?green:teal);
        t1.setOnClickListener(v->{activeTab=0; render();}); t2.setOnClickListener(v->{activeTab=1; render();}); tabBar.addView(t1,new LinearLayout.LayoutParams(0,dp(50),1)); tabBar.addView(t2,new LinearLayout.LayoutParams(0,dp(50),1));
        ScrollView sv=new ScrollView(this); page=new LinearLayout(this); page.setOrientation(LinearLayout.VERTICAL); page.setPadding(dp(16),dp(8),dp(16),dp(40)); sv.addView(page); root.addView(sv,new LinearLayout.LayoutParams(-1,0,1));
        if(activeTab==0) renderCreate(); else renderCards();
    }

    void renderCreate(){
        add(page,tv(ar?"أنشئ بطاقة موقعك":"Create your location card",22,Color.rgb(20,30,30),Typeface.BOLD));
        add(page,tv(ar?"أضف الاسم، ابحث عن الموقع، أرفق صورتين ثم احفظ البطاقة.":"Add name, search location, attach up to 2 photos, then save.",14,Color.DKGRAY,Typeface.NORMAL));
        nameEt=et(ar?"مثال: البيت / العمل":"Example: Home / Work"); add(page,label(ar?"اسم البطاقة":"Card title")); add(page,nameEt);
        searchEt=et(ar?"ابحث عن البيت أو المجمع":"Search home/building/compound"); add(page,label(ar?"موقع Google Map":"Google Map location")); add(page,searchEt);
        Button search=btn(ar?"بحث وتحديد الموقع":"Find location",teal); search.setOnClickListener(v->findLocation()); add(page,search);
        coordTxt=tv(ar?"الموقع الحالي: الرياض":"Current: Riyadh",14,Color.DKGRAY,Typeface.BOLD); add(page,coordTxt);
        doorEt=et(ar?"مثال: فيلا 12، الدور الثاني":"Example: Villa 12, second floor"); add(page,label(ar?"تفاصيل الباب / البيت":"Door / home details")); add(page,doorEt);
        Button pick=btn(ar?"إضافة صورتين للباب / البيت":"Add up to 2 door/home photos",green); pick.setOnClickListener(v->pickPhotos()); add(page,pick);
        photoRow=new LinearLayout(this); photoRow.setOrientation(LinearLayout.HORIZONTAL); photoRow.setPadding(0,dp(8),0,dp(8)); add(page,photoRow); refreshTempPhotos();
        Button save=btn(ar?"حفظ البطاقة":"Save card",green); save.setOnClickListener(v->saveCard()); add(page,save);
    }
    TextView label(String s){ TextView l=tv(s,14,teal,Typeface.BOLD); l.setPadding(0,dp(18),0,dp(6)); return l; }

    void renderCards(){
        add(page,tv(ar?"البطاقات المحفوظة":"Saved cards",22,Color.rgb(20,30,30),Typeface.BOLD));
        if(cards.isEmpty()){ add(page,tv(ar?"لا توجد بطاقات بعد":"No cards yet",16,Color.GRAY,Typeface.NORMAL)); return; }
        for(Card c: cards) addCardView(c);
    }

    void addCardView(Card c){
        LinearLayout box=new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); box.setPadding(dp(14),dp(14),dp(14),dp(14)); box.setBackground(round(Color.WHITE,dp(20),Color.rgb(225,230,228))); LinearLayout.LayoutParams bp=new LinearLayout.LayoutParams(-1,-2); bp.setMargins(0,0,0,dp(16)); page.addView(box,bp);
        add(box,tv(c.name,20,teal,Typeface.BOLD)); add(box,tv("📍 https://maps.google.com/?q="+c.lat+","+c.lng,13,Color.DKGRAY,Typeface.NORMAL)); if(c.door.length()>0) add(box,tv("🚪 "+c.door,15,Color.DKGRAY,Typeface.BOLD));
        LinearLayout imgs=new LinearLayout(this); imgs.setOrientation(LinearLayout.HORIZONTAL); box.addView(imgs,new LinearLayout.LayoutParams(-1,dp(120)));
        for(String p:c.photos){ ImageView iv=new ImageView(this); iv.setScaleType(ImageView.ScaleType.CENTER_CROP); iv.setImageURI(Uri.parse(p)); LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,-1,1); lp.setMargins(dp(4),dp(8),dp(4),dp(8)); imgs.addView(iv,lp); }
        EditText phone=et(ar?"رقم واتساب للسائق بدون حفظ":"Driver WhatsApp number (unsaved)"); phone.setInputType(android.text.InputType.TYPE_CLASS_PHONE); add(box,phone);
        Button open=btn(ar?"فتح واتساب وإرسال البطاقة":"Open WhatsApp with card",green); open.setOnClickListener(v->shareToNumber(c,phone.getText().toString())); add(box,open);
        Button del=btn(ar?"حذف البطاقة":"Delete card",Color.rgb(190,40,40)); del.setOnClickListener(v->{cards.remove(c); persist(); render();}); add(box,del);
    }

    void findLocation(){
        String q=searchEt.getText().toString().trim(); if(q.isEmpty()){toast(ar?"اكتب اسم المكان":"Type a place"); return;}
        new Thread(()->{ try{ Geocoder g=new Geocoder(this, Locale.getDefault()); java.util.List<Address> res=g.getFromLocationName(q,1); runOnUiThread(()->{ if(res!=null&&!res.isEmpty()){ Address a=res.get(0); selLat=a.getLatitude(); selLng=a.getLongitude(); selAddress=a.getAddressLine(0); coordTxt.setText("✅ "+selAddress+"\n"+selLat+", "+selLng); } else toast(ar?"لم يتم العثور":"Not found"); }); }catch(Exception e){ runOnUiThread(()->toast(ar?"فشل البحث":"Search failed")); }}).start();
    }
    void pickPhotos(){ Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT); i.setType("image/*"); i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE,true); i.addCategory(Intent.CATEGORY_OPENABLE); startActivityForResult(i,PICK); }
    protected void onActivityResult(int r,int c,Intent d){ super.onActivityResult(r,c,d); if(r==PICK&&c==RESULT_OK&&d!=null){ tempPhotos.clear(); if(d.getClipData()!=null){ for(int i=0;i<Math.min(2,d.getClipData().getItemCount());i++) tempPhotos.add(d.getClipData().getItemAt(i).getUri()); } else if(d.getData()!=null) tempPhotos.add(d.getData()); refreshTempPhotos(); } }
    void refreshTempPhotos(){ if(photoRow==null)return; photoRow.removeAllViews(); for(Uri u:tempPhotos){ ImageView iv=new ImageView(this); iv.setImageURI(u); iv.setScaleType(ImageView.ScaleType.CENTER_CROP); LinearLayout.LayoutParams lp=new LinearLayout.LayoutParams(0,dp(120),1); lp.setMargins(dp(4),dp(4),dp(4),dp(4)); photoRow.addView(iv,lp);} }
    void saveCard(){ String n=nameEt.getText().toString().trim(); if(n.isEmpty()){toast(ar?"اكتب اسم البطاقة":"Add card title"); return;} Card c=new Card(); c.id="c"+System.currentTimeMillis(); c.name=n; c.door=doorEt.getText().toString().trim(); c.lat=selLat; c.lng=selLng; c.address=selAddress; for(Uri u:tempPhotos) c.photos.add(copyToFiles(u,c.id)); cards.add(c); persist(); tempPhotos.clear(); activeTab=1; render(); }
    String copyToFiles(Uri uri){ return copyToFiles(uri,"img"); } String copyToFiles(Uri uri,String prefix){ try{ File f=new File(getFilesDir(),prefix+"_"+System.nanoTime()+".jpg"); InputStream in=getContentResolver().openInputStream(uri); FileOutputStream out=new FileOutputStream(f); byte[] buf=new byte[8192]; int n; while((n=in.read(buf))>0) out.write(buf,0,n); in.close(); out.close(); return Uri.fromFile(f).toString(); }catch(Exception e){ return uri.toString(); } }

    String normPhone(String p){ String d=p.replaceAll("[^0-9+]",""); if(d.startsWith("+")) d=d.substring(1); if(d.startsWith("00")) d=d.substring(2); if(d.startsWith("0")) d="966"+d.substring(1); return d; }
    String message(Card c){ return (ar?"مرحباً 👋":"Hello 👋")+"\n\n🏠 "+c.name+"\n📍 https://maps.google.com/?q="+c.lat+","+c.lng+(c.door.length()>0?"\n🚪 "+c.door:""); }

    void shareToNumber(Card c,String phoneRaw){
        String phone=normPhone(phoneRaw); if(phone.length()<8){toast(ar?"أدخل رقم صحيح":"Enter valid number"); return;}
        try{
            ArrayList<Uri> streams=new ArrayList<>(); Uri cardImg=makeCardImage(c); streams.add(cardImg); for(String p:c.photos) streams.add(fileProviderUri(Uri.parse(p)));
            Intent intent=new Intent(Intent.ACTION_SEND_MULTIPLE); intent.setType("image/*"); intent.putParcelableArrayListExtra(Intent.EXTRA_STREAM,streams); intent.putExtra(Intent.EXTRA_TEXT,message(c)); intent.putExtra("jid", phone+"@s.whatsapp.net"); intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION); intent.setPackage("com.whatsapp");
            startActivity(intent);
        }catch(Exception e){ try{ Intent url=new Intent(Intent.ACTION_VIEW, Uri.parse("https://wa.me/"+phone+"?text="+Uri.encode(message(c)))); startActivity(url); toast(ar?"واتساب فتح بالنص فقط، أرفق الصورة من المشاركة":"WhatsApp opened with text only; attach image from share if needed"); }catch(Exception ex){ toast(ar?"واتساب غير مثبت":"WhatsApp not installed"); }}
    }
    Uri fileProviderUri(Uri u){ if("file".equals(u.getScheme())) return FileProvider.getUriForFile(this,getPackageName()+".fileprovider",new File(u.getPath())); return u; }
    Uri makeCardImage(Card c)throws Exception{ Bitmap bm=Bitmap.createBitmap(1080,1350,Bitmap.Config.ARGB_8888); Canvas cn=new Canvas(bm); Paint p=new Paint(Paint.ANTI_ALIAS_FLAG); p.setColor(bg); cn.drawRect(0,0,1080,1350,p); p.setColor(teal); cn.drawRoundRect(50,50,1030,260,36,36,p); p.setColor(Color.WHITE); p.setTextSize(62); p.setTypeface(Typeface.DEFAULT_BOLD); cn.drawText(c.name,90,145,p); p.setTextSize(34); cn.drawText("ShareMySpot / شارك موقعي",90,210,p); p.setColor(Color.WHITE); cn.drawRoundRect(50,310,1030,560,28,28,p); p.setColor(Color.rgb(20,30,30)); p.setTextSize(38); cn.drawText("📍 https://maps.google.com/?q="+c.lat+","+c.lng,90,390,p); p.setTextSize(40); if(c.door.length()>0) cn.drawText("🚪 "+c.door,90,470,p); int y=610; for(int i=0;i<Math.min(2,c.photos.size());i++){ Bitmap img=BitmapFactory.decodeStream(getContentResolver().openInputStream(Uri.parse(c.photos.get(i)))); if(img!=null){ Rect dst=new Rect(i==0?70:555,y,i==0?525:1010,y+520); cn.drawBitmap(img,null,dst,p); }} File f=new File(getCacheDir(),"sharemyspot_card.png"); FileOutputStream out=new FileOutputStream(f); bm.compress(Bitmap.CompressFormat.PNG,90,out); out.close(); return FileProvider.getUriForFile(this,getPackageName()+".fileprovider",f); }

    void load(){ try{ JSONArray a=new JSONArray(getPreferences(0).getString("cards","[]")); for(int i=0;i<a.length();i++){ JSONObject o=a.getJSONObject(i); Card c=new Card(); c.id=o.getString("id"); c.name=o.getString("name"); c.door=o.optString("door",""); c.address=o.optString("address",""); c.lat=o.optDouble("lat",24.7136); c.lng=o.optDouble("lng",46.6753); JSONArray ps=o.optJSONArray("photos"); if(ps!=null) for(int j=0;j<ps.length();j++) c.photos.add(ps.getString(j)); cards.add(c);} }catch(Exception e){} }
    void persist(){ try{ JSONArray a=new JSONArray(); for(Card c:cards){ JSONObject o=new JSONObject(); o.put("id",c.id);o.put("name",c.name);o.put("door",c.door);o.put("address",c.address);o.put("lat",c.lat);o.put("lng",c.lng); JSONArray ps=new JSONArray(); for(String p:c.photos) ps.put(p); o.put("photos",ps); a.put(o);} getPreferences(0).edit().putString("cards",a.toString()).apply(); }catch(Exception e){} }
    void toast(String s){ Toast.makeText(this,s,Toast.LENGTH_LONG).show(); }
}
