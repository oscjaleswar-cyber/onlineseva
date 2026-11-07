# Online Seva JLS — Customer Login Portal

ଏହି version ରେ ପୁରୁଣା Service Catalogue ରଖି Customer Login, Registration, Forgot Password, Logout ଏବଂ Admin Customer Management ଯୋଡ଼ାଯାଇଛି।

## 1) Supabase Project ତିଆରି କରନ୍ତୁ
1. https://supabase.com/ ରେ account କରି New project ତିଆରି କରନ୍ତୁ।
2. Project Dashboard → SQL Editor → New query ଖୋଲନ୍ତୁ।
3. ଏହି Project ର `supabase-setup.sql` ଫାଇଲ୍ ର ସମସ୍ତ SQL paste କରି Run କରନ୍ତୁ।
4. Authentication → URL Configuration ରେ Site URL ଭାବେ ଆପଣଙ୍କ Netlify URL ଦିଅନ୍ତୁ: `https://onlinesevajls.netlify.app`। Redirect URLs ରେ ଏହା ମଧ୍ୟ ଯୋଡ଼ନ୍ତୁ: `https://onlinesevajls.netlify.app/**`।
5. Authentication → Providers → Email ରେ Email provider enabled ରଖନ୍ତୁ। Email confirmation ଚାଲୁ ରଖିବା ସୁପାରିଶ।

## 2) Website କୁ Supabase ସହିତ ଯୋଡ଼ନ୍ତୁ
1. Supabase → Project Settings → API ଖୋଲନ୍ତୁ।
2. Project URL ଏବଂ `anon` / publishable public key copy କରନ୍ତୁ। `service_role` key କେବେ Website ରେ ରଖିବେ ନାହିଁ।
3. `js/supabase-config.js` ଖୋଲି `YOUR_SUPABASE_PROJECT_URL` ଏବଂ `YOUR_SUPABASE_ANON_PUBLIC_KEY` ସ୍ଥାନରେ ନିଜର values ବସାନ୍ତୁ।

## 3) ପ୍ରଥମ Admin ତିଆରି
1. Website ରେ ନିଜ Email ଦେଇ ପ୍ରଥମ Customer Account register କରନ୍ତୁ।
2. Email confirmation ଥିଲେ Email ର Link ଖୋଲନ୍ତୁ ଏବଂ ପୁଣି Login କରନ୍ତୁ।
3. Supabase → SQL Editor ରେ ଏହି query ଚଲାନ୍ତୁ (ନିଜ Email ବସାନ୍ତୁ):

```sql
update public.profiles
set role = 'admin'
where email = 'YOUR_ADMIN_EMAIL@example.com';
```

4. Website ରୁ Logout କରି ପୁଣି Login କରନ୍ତୁ। Admin ଙ୍କୁ Customer Management panel ଦେଖାଯିବ।

## 4) GitHub / Netlify Deploy
1. ZIP Extract କରନ୍ତୁ। Project ଭିତରର ସମସ୍ତ file/folder ଆପଣଙ୍କ GitHub repository ର root ରେ upload କରନ୍ତୁ (ପୁରୁଣା project କୁ backup ରଖନ୍ତୁ)।
2. GitHub commit କଲେ Netlify ର auto-deploy ହେବ। Deploy ପରେ `https://onlinesevajls.netlify.app` ରେ test କରନ୍ତୁ।

## 5) Customer ବ୍ୟବହାର
- Customer ନିଜ Email ଓ Password ଦେଇ Register କରିବେ।
- Email confirmation ହେଲେ Login କରି Service Portal ବ୍ୟବହାର କରିବେ।
- Admin Customer Management ରୁ Customer Account Activate / Deactivate କରିପାରିବେ।
- Deactivated customer ଙ୍କୁ Portal ଭିତରକୁ ପ୍ରବେଶ ମିଳିବ ନାହିଁ।

## Security notes
- ଏହା customer sign-in wall ଓ profile-based access control ଯୋଡ଼େ। Service catalogue JSON ରେ ଥିବା public government links ଗୁଡ଼ିକ ସାର୍ବଜନିକ ହୋଇପାରେ; ସେଗୁଡ଼ିକୁ ଗୁପ୍ତ ରଖିବା ଉଦ୍ଦେଶ୍ୟ ନୁହେଁ।
- Private customer documents, payments, application records କିମ୍ବା sensitive data ଯୋଡ଼ିବା ପୂର୍ବରୁ ପ୍ରତ୍ୟେକ table ପାଇଁ ଅଲଗା RLS policy ତିଆରି କରନ୍ତୁ।
- Admin role କେବଳ Supabase SQL Editor ରୁ ଦିଅନ୍ତୁ; public registration ରେ role ଚୟନ କରିବାର ବିକଳ୍ପ ନାହିଁ।
- Supabase ର free plan limits ଓ email sending limits ଲାଗୁ ହୋଇପାରେ।
