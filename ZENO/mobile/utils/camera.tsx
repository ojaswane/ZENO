import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { io } from "socket.io-client";

export default function ScannerScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    if (!permission) return <Text>Loading...</Text>;

    if (!permission.granted) {
        return (
            <View>
                <Text>We need camera permission</Text>
                <Button onPress={requestPermission} title="Grant Permission" />
            </View>
        );
    }

    const handleScan = ({ data }: any) => {
        if (scanned) return;
        setScanned(true);

        console.log("Scanned:", data);

        const parsed = JSON.parse(data);

        const socket = io(parsed.serverUrl);

        socket.on("connect", () => {
            console.log("Connected to server");

            socket.emit("join-session", parsed.sessionId);
        });

        socket.on("session-joined", (msg: any) => {
            console.log(" Joined:", msg);
        });
    };

    return (
        <CameraView
            style={{ flex: 1 }}
            facing="back"
            onBarcodeScanned={handleScan}
            barcodeScannerSettings={{
                barcodeTypes: ["qr"],
            }}
        />
    );
}