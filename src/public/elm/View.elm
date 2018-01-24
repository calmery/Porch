module View exposing (view)

import Html exposing (..)
import Html.Events exposing (..)
import Html.Attributes exposing (..)
import Update exposing (Msg(..))
import Model exposing (Model, User, Status)
import List exposing (append)
import Json.Decode


view : Model -> Html Msg
view model =
    section []
        [ createNavigation model
        , if model.page == "/" then
            createChatPage model
          else if model.page == "/profile" then
            createProfilePage model
          else if model.page == "/members" then
            createMembersPage model
          else
            emptyPage
        ]


emptyPage : Html Msg
emptyPage =
    text ""



-- Menu


createNavigation : Model -> Html Msg
createNavigation model =
    nav [ id "nav" ]
        [ div [ id "room" ]
            [ div [ id "room-name" ]
                [ text "Conversation" ]
            , div [ id "room-menu-toggle" ]
                []
            ]
        , div [ id "menu" ]
            [ div
                [ onClick <| ChangePage "/profile"
                , class <|
                    "menu clearfix menu-official"
                        ++ (setMenuOption "/profile" model)
                ]
                [ div [ class "menu-official-icon" ]
                    [ text "˘" ]
                , div [ class "menu-official-name" ]
                    [ text "Profile" ]
                ]
            , div
                [ onClick <| ChangePage "/members"
                , class <|
                    "menu clearfix menu-official"
                        ++ (setMenuOption "/members" model)
                ]
                [ div [ class "menu-official-icon" ]
                    [ text "¸" ]
                , div [ class "menu-official-name" ]
                    [ text "Members" ]
                ]
            , div [ class "menu space" ]
                []
            , div [ class "menu label clearfix menu-default" ]
                [ div [ class "menu-default-name" ]
                    [ text "Channels" ]
                , div [ class "menu-default-icon" ]
                    []
                ]
            , div
                [ onClick <| ChangePage "/"
                , class <|
                    "menu clearfix menu-default"
                        ++ (setMenuOption "/" model)
                ]
                [ div [ class "menu-default-name" ]
                    [ text "General" ]
                , div [ class "menu-default-icon" ]
                    []
                ]
            , div [ class "menu space" ]
                []
            , a [ href "/logout" ]
                [ div [ class "menu clearfix menu-default", attribute "style" "color: #fff; font-size: 15px" ]
                    [ div [ class "menu-default-name" ]
                        [ text "Sign out" ]
                    ]
                ]
            ]
        ]


setMenuOption : String -> Model -> String
setMenuOption page model =
    if model.page == page then
        " selected"
    else
        ""



-- Helper

onKeyDown : (Int -> msg) -> Attribute msg
onKeyDown tagger =
  Html.Events.on "keydown" (Json.Decode.map tagger Html.Events.keyCode)


createHeader : Model -> String -> Html Msg
createHeader model title =
    header [ id "header" ]
        [ div [ id "channel" ]
            [ text title ]
        , div [ id "header-front" ]
            ((if model.page == "/" then
                [ div [ id "search" ]
                    [ div [ id "search-icon" ]
                        [ text "[" ]
                    , textarea [ onInput InputSearchWord, id "search-input", placeholder "Search" ]
                        []
                    ]
                ]
              else
                []
             )
                ++ [ div [ onClick <| ChangePage "/profile", id "profile", attribute "style" "color: #646464;" ]
                        [ div [ id "profile-icon", attribute "style" <| "background: url(" ++ model.account.profile_image_url ++ "); background-size: cover" ]
                            []
                        , div [ id "profile-name" ]
                            [ text model.account.name ]
                        ]
                   ]
            )
        ]



-- Page /


createChatPage : Model -> Html Msg
createChatPage model =
    section [ id "main" ]
        [ createHeader model "General"
        , div [ id "chat", style [("margin-bottom", model.styles.chat)] ]
            [ div [ id "messages" ]
                (if model.temp.search == "" then
                    (List.map
                        (\status ->
                            let
                                u =
                                    List.head <| List.filter (\u -> u.id == status.user) model.users
                            in
                                case u of
                                    Just user ->
                                        createMessage user status

                                    Nothing ->
                                        emptyPage
                        )
                        model.statuses
                    )
                 else
                    (List.map
                        (\status ->
                            let
                                u =
                                    List.head <| List.filter (\u -> u.id == status.user) model.users
                            in
                                case u of
                                    Just user ->
                                        createMessage user status

                                    Nothing ->
                                        emptyPage
                        )
                     <|
                        List.filter (\status -> String.contains model.temp.search status.text) model.statuses
                    )
                )
            , div [ id "chat-input", style [("height", model.styles.chatInput)] ]
                [ textarea [ onInput InputMessage, onKeyDown CheckCommand, id "chat-input-textarea", placeholder "Message to General", Html.Attributes.value model.temp.message, style [("height", model.styles.chatInputTextarea)] ]
                    []
                , div [ onClick SendMessage, id "chat-input-send" ]
                    [ text "Send" ]
                ]
            ]
        ]


createMessage : User -> Status -> Html Msg
createMessage user status =
    div [ class "message clearfix" ]
        [ div [ class "message-icon", attribute "style" <| "background: url( " ++ user.profile_image_url ++ " ); background-size: cover" ]
            []
        , div [ class "message-body" ]
            [ div [ class "message-body-profile clearfix" ]
                [ div [ class "message-body-username" ]
                    [ text user.name ]
                , div [ class "message-body-screen_name" ]
                    [ text <| "@" ++ user.screen_name ]
                , div [ class "message-body-time" ]
                    [ text status.created_at ]
                ]
            , div [ class "message-body-text" ]
                [ text status.text ]
            ]
        ]



-- Page /profile


createProfilePage : Model -> Html Msg
createProfilePage model =
    section [ id "main" ]
        [ createHeader model "My Profile"
        , div [ id "chat" ]
            [ div [ class "content" ]
                [ div [ class "content-label" ]
                    [ text "Name" ]
                , textarea [ onInput AccountNameFieldUpdate, id "username", placeholder "Name" ]
                    []
                ]
            , div [ class "content" ]
                [ div [ class "content-label" ]
                    [ text "Screen Name" ]
                , textarea [ onInput AccountScreenNameFieldUpdate, id "screen_name", placeholder "ScreenName" ]
                    []
                ]
            , div [ class "content" ]
                [ div [ class "content-label" ]
                    [ text "Icon ~500KB" ]
                , input [ accept ".jpg,.gif,.png,image/gif,image/jpeg,image/png", id "image", type_ "file" ]
                    []
                ]
            , div [ onClick AccountUpdate, id "submit" ]
                [ text "Update profile" ]
            ]
        ]



-- Page /members


createMembersPage : Model -> Html Msg
createMembersPage model =
    section [ id "main" ]
        [ createHeader model "Members"
        , div [ id "chat" ]
            [ div [ id "messages" ]
                (List.map
                    (\user ->
                        div [ class "message clearfix" ]
                            [ div [ class "message-icon", attribute "style" <| "background: url( " ++ user.profile_image_url ++ " ); background-size: cover" ]
                                []
                            , div [ class "message-body" ]
                                [ div [ class "message-body-profile clearfix" ]
                                    [ div [ class "message-body-username", attribute "style" "margin-top: 3px;" ]
                                        [ text user.name ]
                                    ]
                                , div [ class "message-body-text", attribute "style" "margin-top: 3px;" ]
                                    [ text <| "@" ++ user.screen_name ]
                                ]
                            ]
                    )
                    model.users
                )
            ]
        ]
