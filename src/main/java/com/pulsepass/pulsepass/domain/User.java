package com.pulsepass.pulsepass.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String username;
    private String email;
    private boolean active;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserProfile profile;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private UserCredential credential;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Set<Role> roles = EnumSet.of(Role.USER);

    @OneToMany(mappedBy = "user")
    private List<Ticket> tickets = new ArrayList<>();

    protected User() {
    }

    public User(String username, String email, boolean active) {
        this.username = username;
        this.email = email;
        this.active = active;
        this.roles = EnumSet.of(Role.USER);
    }

    public void assignProfile(UserProfile profile) {
        this.profile = profile;
        if (profile.getUser() != this) {
            profile.setUser(this);
        }
    }

    public void setCredential(UserCredential credential) {
        this.credential = credential;
        if (credential != null && credential.getUser() != this) {
            credential.setUser(this);
        }
    }

    public void addRole(Role role) {
        if (role != null) {
            this.roles.add(role);
        }
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public UserProfile getProfile() { return profile; }
    public UserCredential getCredential() { return credential; }
    public Set<Role> getRoles() { return roles; }
    public List<Ticket> getTickets() { return tickets; }
}
