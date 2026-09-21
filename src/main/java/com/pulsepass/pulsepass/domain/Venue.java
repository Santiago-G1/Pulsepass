package com.pulsepass.pulsepass.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "venues")
public class Venue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String code;
    private String name;
    private String city;
    private String address;
    private Integer capacity;
    private boolean active;

    @OneToMany(mappedBy = "venue", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Event> events = new ArrayList<>();

    protected Venue() {
    }

    public Venue(String code, String name, String city, String address, Integer capacity, boolean active) {
        this.code = code;
        this.name = name;
        this.city = city;
        this.address = address;
        this.capacity = capacity;
        this.active = active;
    }

    public void addEvent(Event event) {
        if (!events.contains(event)) {
            events.add(event);
        }
        if (event.getVenue() != this) {
            event.setVenue(this);
        }
    }

    public Long getId() { return id; }
    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public List<Event> getEvents() { return events; }
}
