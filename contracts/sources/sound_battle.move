module sound_battle_addr::sound_battle_v5 {

    use std::string::String;
    use std::signer;
    use std::vector;

    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::resource_account;
    use aptos_framework::account;

    use aptos_std::table::{
        Self,
        Table
    };

    // =====================================
    // ERRORS
    // =====================================

    const ENOT_IN_ARENA: u64 = 1;
    const ETOO_SOON_TO_PUSH: u64 = 3;
    const EINVALID_AMOUNT: u64 = 4;
    const EALREADY_IN_ARENA: u64 = 5;
    const ECANNOT_LOVE_SELF: u64 = 6;
    const ENOTHING_TO_CLAIM: u64 = 7;
    const ENOT_ADMIN: u64 = 8;
    const EALREADY_SETTLED: u64 = 10;

    const DAY_SECONDS: u64 = 86400;

    // =====================================
    // STRUCTS
    // =====================================

    struct WarriorTrack has store {

        blob_name: String,

        artist: address,

        daily_push: Table<u64, u64>,

        daily_love: Table<u64, u64>,
    }

    struct DailyBattle has store {

        total_push_pool: u64,

        total_love_pool: u64,

        winners: vector<String>,

        total_winner_push: u64,

        total_winner_love: u64,

        is_settled: bool,

        admin_withdrawn: bool,
    }

    struct ArenaData has key {

        tracks:
            Table<
                String,
                WarriorTrack
            >,

        all_tracks:
            vector<String>,

        user_push_amount:
            Table<
                ContributionKey,
                u64
            >,

        user_love_amount:
            Table<
                ContributionKey,
                u64
            >,

        daily_battles:
            Table<
                u64,
                DailyBattle
            >,

        last_push_time:
            Table<
                address,
                u64
            >,

        start_timestamp:
            u64,

        admin_addr:
            address,

        signer_cap:
            account::SignerCapability,
    }

    struct ContributionKey
        has copy, drop, store {

        day_id: u64,

        blob_name: String,

        user_addr: address,
    }

    struct TrackInfo
        has drop, store, copy {

        blob_name: String,

        artist: address,

        total_push: u64,

        total_love: u64,
    }

    struct WinnerInfo
        has drop, store, copy {

        blob_name: String,

        winner: address,

        final_points: u64,
    }

    // =====================================
    // EVENTS
    // =====================================

    #[event]
    struct PushEvent has drop, store {

        user: address,

        blob_name: String,

        amount: u64,

        day_id: u64
    }

    #[event]
    struct LoveEvent has drop, store {

        user: address,

        blob_name: String,

        amount: u64,

        day_id: u64
    }

    #[event]
    struct SettleEvent has drop, store {

        day_id: u64,

        winners: vector<String>
    }

    // =====================================
    // INIT
    // =====================================

    fun init_module(
        admin: &signer
    ) {

        let signer_cap =
            resource_account::retrieve_resource_account_cap(
                admin,
                @source_addr
            );

        let resource_signer =
            account::create_signer_with_capability(
                &signer_cap
            );

        move_to(
            &resource_signer,
            ArenaData {

                tracks:
                    table::new(),

                all_tracks:
                    vector::empty(),

                user_push_amount:
                    table::new(),

                user_love_amount:
                    table::new(),

                daily_battles:
                    table::new(),

                last_push_time:
                    table::new(),

                start_timestamp:
                    timestamp::now_seconds(),

                admin_addr:
                    signer::address_of(
                        admin
                    ),

                signer_cap,
            }
        );
    }

    // =====================================
    // DAY ID
    // =====================================

    fun get_day_id(): u64 {

        timestamp::now_seconds()
            / DAY_SECONDS
    }

    // =====================================
    // NEW VIEW FUNCTIONS
    // =====================================

    #[view]
    public fun current_day_id(): u64 {

        get_day_id()
    }

    #[view]
    public fun is_day_settled(
        day_id: u64
    ): bool acquires ArenaData {

        let arena =
            borrow_global<
                ArenaData
            >(
                @sound_battle_addr
            );

        if (
            !table::contains(
                &arena.daily_battles,
                day_id
            )
        ) {

            return false
        };

        let battle =
            table::borrow(
                &arena.daily_battles,
                day_id
            );

        battle.is_settled
    }

    #[view]
    public fun has_day_activity(
        day_id: u64
    ): bool acquires ArenaData {

        let arena =
            borrow_global<
                ArenaData
            >(
                @sound_battle_addr
            );

        let i = 0;

        let len =
            vector::length(
                &arena.all_tracks
            );

        while (i < len) {

            let b_name =
                *vector::borrow(
                    &arena.all_tracks,
                    i
                );

            let track =
                table::borrow(
                    &arena.tracks,
                    b_name
                );

            let p_amt =
                *table::borrow_with_default(
                    &track.daily_push,
                    day_id,
                    &0
                );

            let l_amt =
                *table::borrow_with_default(
                    &track.daily_love,
                    day_id,
                    &0
                );

            if (
                p_amt > 0 ||
                l_amt > 0
            ) {

                return true
            };

            i = i + 1;
        };

        false
    }

        #[view]
    public fun can_pull_reward(
        day_id: u64,
        blob_name: String,
        user: address
    ): bool acquires ArenaData {

        let arena =
            borrow_global<
                ArenaData
            >(
                @sound_battle_addr
            );

        if (
            !table::contains(
                &arena.daily_battles,
                day_id
            )
        ) {

            return false
        };

        let battle =
            table::borrow(
                &arena.daily_battles,
                day_id
            );

        if (
            !battle.is_settled
        ) {

            return false
        };

        if (
            !vector::contains(
                &battle.winners,
                &blob_name
            )
        ) {

            return false
        };

        let key =
            ContributionKey {

                day_id,

                blob_name,

                user_addr:
                    user
            };

        let pushed =
            *table::borrow_with_default(
                &arena.user_push_amount,
                key,
                &0
            );

        pushed > 0
    }

    #[view]
    public fun can_claim_love_reward(
        day_id: u64,
        blob_name: String,
        user: address
    ): bool acquires ArenaData {

        let arena =
            borrow_global<
                ArenaData
            >(
                @sound_battle_addr
            );

        if (
            !table::contains(
                &arena.daily_battles,
                day_id
            )
        ) {

            return false
        };

        let battle =
            table::borrow(
                &arena.daily_battles,
                day_id
            );

        if (
            !battle.is_settled
        ) {

            return false
        };

        if (
            !vector::contains(
                &battle.winners,
                &blob_name
            )
        ) {

            return false
        };

        let key =
            ContributionKey {

                day_id,

                blob_name,

                user_addr:
                    user
            };

        let loved =
            *table::borrow_with_default(
                &arena.user_love_amount,
                key,
                &0
            );

        loved > 0
    }

    // =====================================
    // VIEW FUNCTIONS
    // =====================================

    #[view]
    public fun get_arena_info():
        vector<TrackInfo>
    acquires ArenaData {

        let arena =
            borrow_global<
                ArenaData
            >(
                @sound_battle_addr
            );

        let day_id =
            get_day_id();

        let result =
            vector::empty<
                TrackInfo
            >();

        let i = 0;

        let len =
            vector::length(
                &arena.all_tracks
            );

        let count = 0;

        while (
            i < len &&
            count < 20
        ) {

            let b_name =
                *vector::borrow(
                    &arena.all_tracks,
                    i
                );

            let track =
                table::borrow(
                    &arena.tracks,
                    b_name
                );

            let push_amt =
                *table::borrow_with_default(
                    &track.daily_push,
                    day_id,
                    &0
                );

            let love_amt =
                *table::borrow_with_default(
                    &track.daily_love,
                    day_id,
                    &0
                );

            if (
                push_amt > 0 ||
                love_amt > 0
            ) {

                vector::push_back(
                    &mut result,
                    TrackInfo {

                        blob_name:
                            b_name,

                        artist:
                            track.artist,

                        total_push:
                            push_amt,

                        total_love:
                            love_amt,
                    }
                );

                count =
                    count + 1;
            };

            i = i + 1;
        };

        result
    }

    #[view]
    public fun get_winners_gallery(
        day_id: u64
    ): vector<WinnerInfo>
    acquires ArenaData {

        let arena =
            borrow_global<
                ArenaData
            >(
                @sound_battle_addr
            );

        let result =
            vector::empty<
                WinnerInfo
            >();

        if (
            !table::contains(
                &arena.daily_battles,
                day_id
            )
        ) {

            return result
        };

        let battle =
            table::borrow(
                &arena.daily_battles,
                day_id
            );

        if (
            !battle.is_settled
        ) {

            return result
        };

        let i = 0;

        let len =
            vector::length(
                &battle.winners
            );

        while (i < len) {

            let b_name =
                *vector::borrow(
                    &battle.winners,
                    i
                );

            let track =
                table::borrow(
                    &arena.tracks,
                    b_name
                );

            let final_pts =
                *table::borrow_with_default(
                    &track.daily_push,
                    day_id,
                    &0
                );

            vector::push_back(
                &mut result,
                WinnerInfo {

                    blob_name:
                        b_name,

                    winner:
                        track.artist,

                    final_points:
                        final_pts,
                }
            );

            i = i + 1;
        };

        result
    }

    // =====================================
    // SETTLE
    // =====================================

    public entry fun settle_battle(
        _user: &signer,
        day_id: u64
    ) acquires ArenaData {

        let arena =
            borrow_global_mut<
                ArenaData
            >(
                @sound_battle_addr
            );

        let current_day =
            get_day_id();

        assert!(
            day_id < current_day,
            ENOTHING_TO_CLAIM
        );

        ensure_daily_battle(
            arena,
            day_id
        );

        let battle =
            table::borrow_mut(
                &mut arena.daily_battles,
                day_id
            );

        assert!(
            !battle.is_settled,
            EALREADY_SETTLED
        );

        let winners =
            vector::empty<
                String
            >();

        let total_win_push = 0;

        let total_win_love = 0;

        let i = 0;

        let len =
            vector::length(
                &arena.all_tracks
            );

        while (i < len) {

            let b_name =
                *vector::borrow(
                    &arena.all_tracks,
                    i
                );

            let track =
                table::borrow(
                    &arena.tracks,
                    b_name
                );

            let p_amt =
                *table::borrow_with_default(
                    &track.daily_push,
                    day_id,
                    &0
                );

            if (p_amt > 0) {

                let l_amt =
                    *table::borrow_with_default(
                        &track.daily_love,
                        day_id,
                        &0
                    );

                vector::push_back(
                    &mut winners,
                    b_name
                );

                total_win_push =
                    total_win_push +
                    p_amt;

                total_win_love =
                    total_win_love +
                    l_amt;
            };

            i = i + 1;
        };

        battle.winners =
            winners;

        battle.total_winner_push =
            total_win_push;

        battle.total_winner_love =
            total_win_love;

        battle.is_settled =
            true;
    }

    // =====================================
    // PUSH SONG
    // =====================================

    public entry fun push_song(
        user: &signer,
        blob_name: String,
        amount: u64
    ) acquires ArenaData {

        let user_addr =
            signer::address_of(
                user
            );

        let arena =
            borrow_global_mut<
                ArenaData
            >(
                @sound_battle_addr
            );

        let day_id =
            get_day_id();

        if (
            table::contains(
                &arena.last_push_time,
                user_addr
            )
        ) {

            let last_push_timestamp =
                *table::borrow(
                    &arena.last_push_time,
                    user_addr
                );

            let last_day_id =
                last_push_timestamp
                    / DAY_SECONDS;

            assert!(
                day_id > last_day_id,
                ETOO_SOON_TO_PUSH
            );
        };

        coin::transfer<
            AptosCoin
        >(
            user,
            @sound_battle_addr,
            amount
        );

        if (
            !table::contains(
                &arena.tracks,
                blob_name
            )
        ) {

            let new_track =
                WarriorTrack {

                    blob_name,

                    artist:
                        user_addr,

                    daily_push:
                        table::new(),

                    daily_love:
                        table::new(),
                };

            table::add(
                &mut arena.tracks,
                blob_name,
                new_track
            );

            vector::push_back(
                &mut arena.all_tracks,
                blob_name
            );
        };

        let track =
            table::borrow_mut(
                &mut arena.tracks,
                blob_name
            );

        let d_push =
            *table::borrow_with_default(
                &track.daily_push,
                day_id,
                &0
            );

        table::upsert(
            &mut track.daily_push,
            day_id,
            d_push + amount
        );

        ensure_daily_battle(
            arena,
            day_id
        );

        let battle =
            table::borrow_mut(
                &mut arena.daily_battles,
                day_id
            );

        battle.total_push_pool =
            battle.total_push_pool +
            amount;

        let key =
            ContributionKey {

                day_id,

                blob_name,

                user_addr,
            };

        let current =
            *table::borrow_with_default(
                &arena.user_push_amount,
                key,
                &0
            );

        table::upsert(
            &mut arena.user_push_amount,
            key,
            current + amount
        );

        table::upsert(
            &mut arena.last_push_time,
            user_addr,
            timestamp::now_seconds()
        );
    }

    // =====================================
    // LOVE SONG
    // =====================================

    public entry fun love_song(
        user: &signer,
        blob_name: String,
        amount: u64
    ) acquires ArenaData {

        let user_addr =
            signer::address_of(
                user
            );

        let arena =
            borrow_global_mut<
                ArenaData
            >(
                @sound_battle_addr
            );

        let day_id =
            get_day_id();

        let track =
            table::borrow_mut(
                &mut arena.tracks,
                blob_name
            );

        assert!(
            user_addr != track.artist,
            ECANNOT_LOVE_SELF
        );

        coin::transfer<
            AptosCoin
        >(
            user,
            @sound_battle_addr,
            amount
        );

        let d_love =
            *table::borrow_with_default(
                &track.daily_love,
                day_id,
                &0
            );

        table::upsert(
            &mut track.daily_love,
            day_id,
            d_love + amount
        );

        ensure_daily_battle(
            arena,
            day_id
        );

        let battle =
            table::borrow_mut(
                &mut arena.daily_battles,
                day_id
            );

        battle.total_love_pool =
            battle.total_love_pool +
            amount;

        let key =
            ContributionKey {

                day_id,

                blob_name,

                user_addr,
            };

        let current =
            *table::borrow_with_default(
                &arena.user_love_amount,
                key,
                &0
            );

        table::upsert(
            &mut arena.user_love_amount,
            key,
            current + amount
        );
    }

    // =====================================
    // PULL REWARD
    // =====================================

    public entry fun pull_reward(
        artist: &signer,
        day_id: u64,
        blob_name: String
    ) acquires ArenaData {

        let artist_addr =
            signer::address_of(
                artist
            );

        let arena =
            borrow_global_mut<
                ArenaData
            >(
                @sound_battle_addr
            );

        let battle =
            table::borrow(
                &arena.daily_battles,
                day_id
            );

        assert!(
            battle.is_settled,
            ENOTHING_TO_CLAIM
        );

        assert!(
            vector::contains(
                &battle.winners,
                &blob_name
            ),
            ENOTHING_TO_CLAIM
        );

        let key =
            ContributionKey {

                day_id,

                blob_name,

                user_addr:
                    artist_addr
            };

        let user_pushed =
            *table::borrow_with_default(
                &arena.user_push_amount,
                key,
                &0
            );

        assert!(
            user_pushed > 0,
            ENOTHING_TO_CLAIM
        );

        let reward =
            (
                (
                    (
                        battle.total_push_pool
                            as u128
                    ) * 69 / 100
                ) *
                (
                    user_pushed
                        as u128
                ) /
                (
                    battle.total_winner_push
                        as u128
                )
            as u64);

        table::upsert(
            &mut arena.user_push_amount,
            key,
            0
        );

        let resource_signer =
            account::create_signer_with_capability(
                &arena.signer_cap
            );

        coin::transfer<
            AptosCoin
        >(
            &resource_signer,
            artist_addr,
            reward
        );
    }

    // =====================================
    // CLAIM LOVE REWARD
    // =====================================

    public entry fun claim_love_reward(
        fan: &signer,
        day_id: u64,
        blob_name: String
    ) acquires ArenaData {

        let fan_addr =
            signer::address_of(
                fan
            );

        let arena =
            borrow_global_mut<
                ArenaData
            >(
                @sound_battle_addr
            );

        let battle =
            table::borrow(
                &arena.daily_battles,
                day_id
            );

        assert!(
            battle.is_settled,
            ENOTHING_TO_CLAIM
        );

        assert!(
            vector::contains(
                &battle.winners,
                &blob_name
            ),
            ENOTHING_TO_CLAIM
        );

        let key =
            ContributionKey {

                day_id,

                blob_name,

                user_addr:
                    fan_addr
            };

        let user_loved =
            *table::borrow_with_default(
                &arena.user_love_amount,
                key,
                &0
            );

        assert!(
            user_loved > 0,
            ENOTHING_TO_CLAIM
        );

        let reward =
            (
                (
                    (
                        battle.total_love_pool
                            as u128
                    ) * 69 / 100
                ) *
                (
                    user_loved
                        as u128
                ) /
                (
                    battle.total_winner_love
                        as u128
                )
            as u64);

        table::upsert(
            &mut arena.user_love_amount,
            key,
            0
        );

        let resource_signer =
            account::create_signer_with_capability(
                &arena.signer_cap
            );

        coin::transfer<
            AptosCoin
        >(
            &resource_signer,
            fan_addr,
            reward
        );
    }

    // =====================================
    // ADMIN WITHDRAW
    // =====================================

    public entry fun admin_withdraw(
        admin: &signer,
        day_id: u64
    ) acquires ArenaData {

        let arena =
            borrow_global_mut<
                ArenaData
            >(
                @sound_battle_addr
            );

        assert!(
            signer::address_of(
                admin
            ) == arena.admin_addr,
            ENOT_ADMIN
        );

        let battle =
            table::borrow_mut(
                &mut arena.daily_battles,
                day_id
            );

        assert!(
            battle.is_settled &&
            !battle.admin_withdrawn,
            EALREADY_SETTLED
        );

        let total_pool =
            battle.total_push_pool +
            battle.total_love_pool;

        let admin_share =
            (total_pool * 31) / 100;

        battle.admin_withdrawn =
            true;

        let resource_signer =
            account::create_signer_with_capability(
                &arena.signer_cap
            );

        coin::transfer<
            AptosCoin
        >(
            &resource_signer,
            arena.admin_addr,
            admin_share
        );
    }

    // =====================================
    // ENSURE DAILY BATTLE
    // =====================================

    fun ensure_daily_battle(
        arena: &mut ArenaData,
        day_id: u64
    ) {

        if (
            !table::contains(
                &arena.daily_battles,
                day_id
            )
        ) {

            table::add(
                &mut arena.daily_battles,
                day_id,
                DailyBattle {

                    total_push_pool: 0,

                    total_love_pool: 0,

                    winners:
                        vector::empty(),

                    total_winner_push: 0,

                    total_winner_love: 0,

                    is_settled: false,

                    admin_withdrawn: false,
                }
            );
        };
    }
}