package chocoloom.app;

import android.os.Bundle;
import android.os.Build;
import android.util.DisplayMetrics;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Enable edge-to-edge full-screen display extending into the camera notch cutout
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            WindowManager.LayoutParams params = window.getAttributes();
            params.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            window.setAttributes(params);
        }

        // Set transparent status and navigation bars so WebView bleeds behind notch
        WindowCompat.setDecorFitsSystemWindows(window, false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        // Automatically measure notch & navigation bar insets and dispatch to WebView
        View decorView = window.getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(decorView, (v, windowInsets) -> {
            int top = windowInsets.getInsets(WindowInsetsCompat.Type.statusBars() | WindowInsetsCompat.Type.displayCutout()).top;
            int bottom = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            int left = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()).left;
            int right = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()).right;

            DisplayMetrics metrics = getResources().getDisplayMetrics();
            float density = metrics.density;
            final int topDp = density > 0 ? Math.round(top / density) : top;
            final int bottomDp = density > 0 ? Math.round(bottom / density) : bottom;
            final int leftDp = density > 0 ? Math.round(left / density) : left;
            final int rightDp = density > 0 ? Math.round(right / density) : right;

            decorView.post(() -> {
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        WebView webView = getBridge().getWebView();
                        String js = String.format(
                            "window.updateDeviceSafeAreas && window.updateDeviceSafeAreas(%d, %d, %d, %d);",
                            topDp, bottomDp, leftDp, rightDp
                        );
                        webView.evaluateJavascript(js, null);
                    }
                } catch (Exception ignored) {}
            });

            return windowInsets;
        });
    }
}
