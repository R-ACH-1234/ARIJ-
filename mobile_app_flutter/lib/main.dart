import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  MobileAds.instance.initialize();
  runApp(const RadioApp());
}

class RadioApp extends StatelessWidget {
  const RadioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ARiJ Radio',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(primarySwatch: Colors.blue, brightness: Brightness.dark),
      home: const SplashScreen(),
    );
  }
}

// 1. Splash Screen
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(seconds: 3), () {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (context) => const RadioHomeScreen()),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1E1E1E), // Match web theme
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Placeholder for your logo
            const Icon(Icons.radio, size: 100, color: Color(0xFFe5b84b)),
            const SizedBox(height: 20),
            const Text(
              'ARiJ Radio',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 2),
            ),
          ],
        ),
      ),
    );
  }
}

// 2. Main Webview Screen
class RadioHomeScreen extends StatefulWidget {
  const RadioHomeScreen({super.key});
  @override
  State<RadioHomeScreen> createState() => _RadioHomeScreenState();
}

class _RadioHomeScreenState extends State<RadioHomeScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasInternet = true;
  BannerAd? _bannerAd;
  bool _isBannerAdLoaded = false;

  // Replace with your actual live domain later.
  final String webAppUrl = "https://ais-pre-hbfw4ianfyf4225lky5mmw-810930083023.europe-west2.run.app/";

  // AdMob Configuration
  // ⚠️ CRITICAL: KEEP TEST MODE AS TRUE DURING DEVELOPMENT TO AVOID ACCOUNT BAN
  final bool _isTestMode = true; 
  
  // Your Official Production IDs
  final String _productionBannerId = "ca-app-pub-9157920423630982/9820531767";
  
  // Google Official Test IDs
  final String _testBannerIdAndroid = "ca-app-pub-3940256099942544/6300978111"; 
  final String _testBannerIdIos = "ca-app-pub-3940256099942544/2934735716";

  late StreamSubscription<List<ConnectivityResult>> _connectivitySubscription;

  @override
  void initState() {
    super.initState();
    _checkInitialInternet();
    
    _connectivitySubscription = Connectivity().onConnectivityChanged.listen((List<ConnectivityResult> results) {
      final hasConnection = !results.contains(ConnectivityResult.none);
      if (hasConnection != _hasInternet) {
        setState(() {
          _hasInternet = hasConnection;
          if (_hasInternet && _isLoading) {
            _controller.reload();
          }
        });
      }
    });

    _initWebViewController();
    _loadBannerAd();
  }

  Future<void> _checkInitialInternet() async {
    final results = await Connectivity().checkConnectivity();
    setState(() {
      _hasInternet = !results.contains(ConnectivityResult.none);
    });
  }

  void _initWebViewController() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF111111)) // Dark background
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
             setState(() { _isLoading = true; });
          },
          onPageFinished: (String url) {
            setState(() { _isLoading = false; });
          },
          onWebResourceError: (WebResourceError error) {
            debugPrint('WebView Error: ${error.description}');
          },
        ),
      )
      ..loadRequest(Uri.parse(webAppUrl));
  }

  void _loadBannerAd() {
    String adUnitId = _isTestMode
        ? (Platform.isAndroid ? _testBannerIdAndroid : _testBannerIdIos)
        : _productionBannerId;

    _bannerAd = BannerAd(
      adUnitId: adUnitId,
      request: const AdRequest(),
      size: AdSize.banner,
      listener: BannerAdListener(
        onAdLoaded: (ad) {
          setState(() { _isBannerAdLoaded = true; });
        },
        onAdFailedToLoad: (ad, err) {
          debugPrint('BannerAd failed to load: $err');
          ad.dispose();
        },
      ),
    )..load();
  }

  @override
  void dispose() {
    _connectivitySubscription.cancel();
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_hasInternet) {
      return _buildNoInternetScreen();
    }

    return Scaffold(
      backgroundColor: const Color(0xFF111111),
      body: SafeArea(
        bottom: false,
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(color: Color(0xFFe5b84b)),
              ),
          ],
        ),
      ),
      bottomNavigationBar: _isBannerAdLoaded && _bannerAd != null
          ? SafeArea(
              child: SizedBox(
                width: _bannerAd!.size.width.toDouble(),
                height: _bannerAd!.size.height.toDouble(),
                child: AdWidget(ad: _bannerAd!),
              ),
            )
          : const SizedBox.shrink(),
    );
  }

  Widget _buildNoInternetScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFF1E1E1E),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off, size: 80, color: Colors.grey),
            const SizedBox(height: 20),
            const Text(
              'لا يوجد اتصال بالإنترنت\nNo Internet Connection',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFe5b84b),
                padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _checkInitialInternet,
              child: const Text('إعادة المحاولة / Retry', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
            )
          ],
        ),
      ),
    );
  }
}
