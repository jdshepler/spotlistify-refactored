import React, {Component} from 'react';
import './App.css';
import axios from 'axios';
import Spotify from "spotify-web-api-js";
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Alert from '@material-ui/lab/Alert';
import styled from 'styled-components';
import clsx from 'clsx';
import { withStyles } from "@material-ui/core/styles";


const spotifyWebApi = new Spotify();
let key = 0;

const styles = {
    root: {
        '& label.Mui-focused': {
            color: 'white',
        },
        '& .MuiInput-underline:after': {
            borderBottomColor: 'white',
        },
        '& .MuiOutlinedInput-root': {
            '& fieldset': {
                borderColor: 'white',
            },
            '&:hover fieldset': {
                borderColor: 'white',
            },
            '&.Mui-focused fieldset': {
                borderColor: 'white',
            },
        },
    },
    input: {
        color: 'white'
    },
    cssLabel: {
        color : 'white'
    },
};

class App extends Component {
    constructor(props) {
        super(props);
        const params = this.getHashParams();
        const token = params.access_token;

        this.onChangeArtist = this.onChangeArtist.bind(this);
        this.searchArtist = this.searchArtist.bind(this);
        this.state = {
            loggedIn: token ? true: false,
            userID: '',
            artistName: '',
            artistSetDate: '',
            artistSetURIs: [],
            playlistID: '',
            playlistTracks: [],
        }
        if (token){
            spotifyWebApi.setAccessToken(token)
        }
    }

    getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        e = r.exec(q)
        while (e) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
            e = r.exec(q);
        }
        return hashParams;
    }

    onChangeArtist(e) {
        this.setState({
            artistName: e.target.value
        })
    }

    searchSpotifyTracks(songName, artistName) {
        let query = songName + " " + artistName;
        spotifyWebApi.searchTracks(query)
            .then(res => {
                key++;
                this.state.artistSetURIs.push(res.tracks.items[0].uri)
                this.state.playlistTracks.push(
                <Alert severity="success" key={key} style={{margin: '5px'}}>
                Success! <b> {songName} by {artistName} </b> added to playlist
                </Alert>);
            })
            .catch(err => {
                key++;
                this.state.playlistTracks.push(
                <Alert severity="error" key={key} style={{margin: '5px'}}>
                Error! Could not find <b> {songName} by {artistName} </b>
                </Alert>);
                console.log(err)
            });
    }

    getUserID() {
        spotifyWebApi.getMe()
            .then(res => {
                this.setState({
                    userID: res.id
                })
                console.log(this.state.userID)
                this.createSetlistPlaylist()
            })
            .catch(err => console.log(err));
    }

    createSetlistPlaylist() {
        spotifyWebApi.createPlaylist(this.state.userID, {name: this.state.artistName + " Setlist " + this.state.artistSetDate})
            .then(res => {
                this.setState({
                    playlistID: res.id
                });
                this.addTracks()
            })
            .catch(err => console.log(err));
    }

    addTracks() {
        spotifyWebApi.addTracksToPlaylist(this.state.playlistID, this.state.artistSetURIs)
            .then(res => {
                console.log(res)
            })
            .catch(err => {
                console.log(err)
            });
    }


    searchArtist() {
        const searchArtistURL = "https://cors-anywhere.herokuapp.com/https://api.setlist.fm/rest/1.0/search/artists";
        const searchArtistConfig = {
            headers: {
                "Accept": "application/json",
                "x-api-key": "FsKLJ5csXlSKHt5H_rSLcCxNt3gg1oegOmKB"
            }
        }

        const params = new URLSearchParams({
            artistName: this.state.artistName,
            p: "1",
            sort: "relevance"
        }).toString();

        return axios.get(`${searchArtistURL}?${params}`, searchArtistConfig)
            .then(res => {
                console.log(res.data)
                this.setState({
                    playlistTracks: [],
                    artistSetURIs: [],
                    artistName: res.data.artist[0].name
                });
                key = 0;
                this.searchSetlists(res.data.artist[0].mbid)
            })


            // .then(data => this.getArtistMBID(data))
            .catch(err => {
                this.setState({
                    playlistTracks: [],
                })
                this.state.playlistTracks.push(
                <Alert severity="error" key={1} style={{margin: '5px'}}>
                Error! Could not find artist: <b> {this.state.artistName} </b>
                </Alert>)
                this.setState({
                    artistName: ''
                })
                console.log(err)
            });
    }

    searchSetlists(artistMBID) {
        const searchSetlistsURL = "https://cors-anywhere.herokuapp.com/https://api.setlist.fm/rest/1.0/artist/" + artistMBID + "/setlists";
        const searchSetlistsConfig = {
            headers: {
                "Accept": "application/json",
                "x-api-key": "FsKLJ5csXlSKHt5H_rSLcCxNt3gg1oegOmKB"
            }
        }

        const params = new URLSearchParams({
            p: "1",
        }).toString();

        return axios.get(`${searchSetlistsURL}?${params}`, searchSetlistsConfig)
            .then(res => {
                let x;
                let y = 0;
                while (res.data.setlist[y].sets.set.length < 1){
                    y++;
                }
                for (x in res.data.setlist[y].sets.set[0].song)
                    this.searchSpotifyTracks(res.data.setlist[y].sets.set[0].song[x].name, this.state.artistName)
                this.setState({
                    artistSetDate: res.data.setlist[0].eventDate
                })
                this.getUserID();
                console.log(res.data)
            })
            .catch(err => {
                this.setState({
                    playlistTracks: [],
                })
                this.state.playlistTracks.push(
                <Alert severity="error" key={1} style={{margin: '5px'}}>
                Error! <b> Too many requests, try again later </b>
                </Alert>)
                this.setState({
                    artistName: ''
                })
                console.log(err)
            });
    }

    render() {
        const PaperDiv = styled.div`
            background: linear-gradient(rgba(255,255,255, .4), rgba(255,255,255,.2));
            border-radius: 15px;
            margin: 30px;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 25px;
            border: 3px solid white;
            box-shadow: 13px 15px 29px 5px rgba(0,0,0,0.25);
        `;

        const { classes, className } = this.props;

        let home;
        if (this.state.loggedIn) {
            home = (
                <Grid
            container
            direction="column"
            justify="center"
            alignItems="center"
            spacing={2}
                >
                <Grid item>
            <Typography
            variant="h2"
            style={{
                color: 'white',
                    fontFamily: 'Quicksand',
            }}>
            SPOTLISTIFY
            </Typography>
            </Grid>
            <Grid item>
            <TextField
            className={clsx(classes.root, className)}
            inputProps={{
                className: classes.input,
            }}
            InputLabelProps={{
                classes: {
                    root: classes.cssLabel,
                }
            }}
            id="outlined-number"
            label="Enter Artist's Name"
            variant="outlined"
            autoFocus
            defaultValue={this.state.artistName}
            onChange={this.onChangeArtist}
            />
            </Grid>
            <Grid item>
            <Button
            variant="outlined"
            size="large"
            onClick={this.searchArtist}
            style={{
                color: 'white',
                    border: '1px solid white',
                    background: 'linear-gradient(rgba(225,196,138, .5), rgba(206,142,55, .6), rgba(114,38,35, .5), rgba(36,17,23, .6)',
                    borderRadius: 10,
                    fontFamily: 'Quicksand',
            }}
        >
            Generate Playlist
            </Button>
            </Grid>
            </Grid>
        )

        } else {
            home = (
                <Grid
            container
            direction="column"
            justify="center"
            alignItems="center"
            spacing={2}
                >
                <Grid item>
            <Typography
            variant="h2"
            style={{
                color: 'white',
                    fontFamily: 'Quicksand'
            }}>
            SPOTLISTIFY
            </Typography>
            </Grid>
            <Grid item>
            <Button
            variant="outlined"
            size="large"
            onClick={this.searchArtist}
            href='http://localhost:5000'
            style={{
                color: 'black',
                    background: 'linear-gradient(rgba(255,255,255, .8), rgba(255,255,255, .6)',
                    borderRadius: 5,
                    fontFamily: 'Quicksand'
            }}
        >
        <h4>Login to Spotify</h4>
            </Button>
            </Grid>
            </Grid>

        )
        }



        return (
            <div className="App">
            <Grid container
        direction="column"
        justify="center"
        alignItems="center"
            >
            <Grid item>
        <PaperDiv>
        { home }
        </PaperDiv>
        </Grid>
        <Grid item>
        {this.state.playlistTracks}
        </Grid>
        </Grid>
        </div>
    );
    }
}

export default withStyles(styles)(App);