import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllMovies, getCollections, getDB, LocalMovie } from './database';
import { Alert } from 'react-native';

export const exportBackup = async () => {
  try {
    const movies = await getAllMovies();
    const collections = await getCollections();

    const backupData = {
      version: 1,
      exportDate: new Date().toISOString(),
      appName: 'CineVault',
      data: {
        movies,
        collections
      }
    };

    const fileName = `CineVault_Backup_${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = FileSystem.cacheDirectory + fileName;

    await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(backupData, null, 2));

    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Error', 'Sharing is not available on this device');
      return;
    }

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export CineVault Backup',
      UTI: 'public.json'
    });

  } catch (error) {
    console.error('Export Error:', error);
    Alert.alert('Backup Failed', 'Could not create backup file.');
  }
};

export const importBackup = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true
    });

    if (result.canceled) return;

    const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const backup = JSON.parse(fileContent);

    if (backup.appName !== 'CineVault') {
      Alert.alert('Invalid File', 'This doesn\'t appear to be a CineVault backup.');
      return;
    }

    Alert.alert(
      'Restore Data',
      `Found ${backup.data.movies.length} movies. This will overwrite existing items if TMDB IDs match. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            await performRestore(backup.data.movies);
          }
        }
      ]
    );

  } catch (error) {
    console.error('Import Error:', error);
    Alert.alert('Restore Failed', 'The backup file is corrupt or invalid.');
  }
};

const performRestore = async (movies: LocalMovie[]) => {
  const db = getDB();
  try {
    for (const movie of movies) {
      await db.runAsync(
        `INSERT OR REPLACE INTO movies
          (tmdb_id, title, poster_path, backdrop_path, release_date, vote_average, runtime, genres, overview, status, user_rating, user_notes, watch_date, last_viewed, media_type, imdb_id, last_season_watched, last_episode_watched, total_seasons, total_episodes, diary_feeling, diary_recommend, diary_special)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movie.tmdb_id, movie.title, movie.poster_path, movie.backdrop_path,
          movie.release_date, movie.vote_average, movie.runtime,
          movie.genres, movie.overview, movie.status,
          movie.user_rating, movie.user_notes, movie.watch_date,
          movie.last_viewed, movie.media_type, movie.imdb_id,
          movie.last_season_watched, movie.last_episode_watched,
          movie.total_seasons, movie.total_episodes,
          movie.diary_feeling, movie.diary_recommend, movie.diary_special
        ]
      );
    }
    Alert.alert('Success', 'Library restored successfully.');
  } catch (e) {
    console.error('Restore Execution Error:', e);
    Alert.alert('Error', 'Failed to write data to database.');
  }
};
