import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vernacular DPI Onboarding</Text>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => navigation.navigate('Language')}
      >
        <Text style={styles.btnText}>Start Onboarding</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0B0B0B'},
  title:{color:'#CFE6FF',fontSize:26,marginBottom:20,textAlign:'center'},
  btn:{backgroundColor:'#6AA6FF',padding:16,borderRadius:12,width:'70%',alignItems:'center'},
  btnText:{color:'#000',fontSize:18,fontWeight:'bold'}
});
