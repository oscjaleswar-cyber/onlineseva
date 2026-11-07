# Online Seva JLS — Username Customer Login

ଏହି project ରେ ପୁରୁଣା Online Seva JLS Service Catalogue ରଖି Username + Password Customer Login ଯୋଡ଼ାଯାଇଛି। Customer ନିଜ Username ବାଛି Register କରିପାରିବେ।

## A. ଆପଣଙ୍କ ପୂର୍ବରୁ କରାଯାଇଥିବା Supabase Setup
ଆପଣ ପୂର୍ବରୁ profiles table ତିଆରି କରିଛନ୍ତି। ଏବେ Supabase → SQL Editor → New Query ରେ `username-login-migration.sql` ର ସମସ୍ତ SQL paste କରି Run କରନ୍ତୁ। ଏହା ପୁରୁଣା profiles table ରେ username ଓ contact_email ଯୋଡ଼ିବ।

## B. Username Login အାବଶ୍ୟକ Supabase Setting
1. Supabase Dashboard → Authentication → Sign In / Providers → Email ଖୋଲନ୍ତୁ।
2. Email provider Enabled ରଖନ୍ତୁ।
3. **Confirm email / Email confirmations OFF** କରନ୍ତୁ। Username login ପାଇଁ ଏହା ଦରକାର, କାରଣ Auth ଭିତରେ username କୁ synthetic email identity ଭାବରେ ବ୍ୟବହାର କରାଯାଉଛି।
4. ଏହି synthetic address କୁ email ପଠାଯିବ ନାହିଁ। ତେଣୁ Customer ଙ୍କ Email optional contact email ଭାବରେ ରଖାଯାଏ, Auth login ପାଇଁ ନୁହେଁ।

## C. Project URL ଓ Public Key
Supabase → Project Settings → API ରୁ Project URL ଓ anon/publishable public key copy କରନ୍ତୁ। `js/supabase-config.js` ରେ ବସାନ୍ତୁ। `service_role` / secret key କେବେ browser code କିମ୍ବା GitHub ରେ ରଖିବେ ନାହିଁ।

## D. ପ୍ରଥମ Admin
1. Netlify website ରେ ନିଜ ନାମ, ନିଜ Admin Username (ଯଥା `jlsadmin`) ଓ Password ଦେଇ Register କରନ୍ତୁ।
2. Supabase → SQL Editor ରେ ନିଜ username ବସାଇ ଏହି query Run କରନ୍ତୁ:

```sql
UPDATE public.profiles SET role = 'admin' WHERE username = 'jlsadmin';
```

3. Logout କରି ପୁଣି Login କରନ୍ତୁ। Admin Customer Management ଦେଖିପାରିବେ। ପ୍ରଥମ Admin କୁ କେବଳ ନିଜେ SQL Editor ରୁ promote କରନ୍ତୁ।

## E. Customer Login
- Customer Register କରିବା ସମୟରେ ନିଜର unique Username (4–30 ଅକ୍ଷର), ନାମ ଓ Password ଦେବେ।
- ଉଦାହରଣ: `OSC1001`, `OSC1002`।
- ପରେ Username + Password ଦେଇ Login କରିବେ।
- Password ଭୁଲିଗଲେ Admin ଙ୍କ ସହିତ ଯୋଗାଯୋଗ କରିବେ। Username-only identity ରେ email-based self-service password reset ନାହିଁ। Admin ଙ୍କୁ Supabase Dashboard ରୁ password reset କରିବାକୁ ପଡ଼ିବ।
- Admin customer account Activate / Deactivate କରିପାରିବେ।

## F. Netlify Deploy
ZIP Extract କରି project ଭିତରର ସମସ୍ତ file/folder GitHub repository ର root ରେ upload/replace କରନ୍ତୁ। Commit କଲେ Netlify auto-deploy ହେବ।

## Security
- Email confirmations OFF ଥିବାରୁ username login ତୁରନ୍ତ ଚାଲିବ; strong password ଓ Supabase Auth rate limits ରଖନ୍ତୁ।
- Username କୁ ଗୁପ୍ତ ଭାବନ୍ତୁ ନାହିଁ; Password ଗୁପ୍ତ ରଖନ୍ତୁ।
- Customer role କୁ browser ରୁ Admin କରିହେବ ନାହିଁ; role update SQL Editor ରୁ କରନ୍ତୁ।
- Service catalogue ର public links ଲୁଚାଇବା ଏହି login ର ଉଦ୍ଦେଶ୍ୟ ନୁହେଁ। Private documents/data ଯୋଡ଼ିବା ପୂର୍ବରୁ server-side authorization ଓ table-specific RLS ଆବଶ୍ୟକ।
