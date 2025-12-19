# How to Publish Your App to Google Play Store

## Step 1: Update App Identifier
Before building, ensure you have a unique App ID. `com.restaurantpos.app` might already be taken.
1.  Open `frontend/capacitor.config.json`
2.  Change `"appId": "com.restaurantpos.app"` to something unique, e.g., `"com.yourname.restaurantpos"`.
3.  Run `npx cap sync`.

## Step 2: Generate Signed App Bundle (AAB)
Google Play requires an **Android App Bundle (.aab)** signed with a release key.

1.  **Open Android Project**:
    ```bash
    cd frontend
    npx cap open android
    ```
2.  **In Android Studio**:
    *   Go to **Build** > **Generate Signed Bundle / APK**.
    *   Select **Android App Bundle** > Next.
    *   **Key Store Path**: Click "Create new..." to make a release key.
        *   Save it somewhere safe (e.g., `release-key.jks`).
        *   Set passwords and fill in certificate info.
    *   **Select Key**: Choose the key you just created.
    *   **Build Variants**: Select `release`.
    *   Click **Finish**.

## Step 3: Locate the File
Once built, Android Studio will show a notification "Generate Signed Bundle".
*   Click "Locate".
*   The file will be named `app-release.aab`.

## Step 4: Upload to Google Play Console
1.  Go to [Google Play Console](https://play.google.com/console).
2.  Create a **New App**.
3.  Fill in the app details (Name, Description, Screenshots).
4.  Go to **Production** (or **Testing** > **Internal Testing** for a test run).
5.  **Create New Release**.
6.  Upload your `app-release.aab` file.
7.  Complete the content rating and privacy setup.
8.  **Submit for Review**!
